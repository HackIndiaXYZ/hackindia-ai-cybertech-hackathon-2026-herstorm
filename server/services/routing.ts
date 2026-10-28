/**
 * Routing and Proximity Dispatch Service for TraceCrop
 *
 * Algorithm Explanation:
 * 1. Greedy Proximity Clustering:
 *    Groups pending "placed" orders based on two physical constraints:
 *    - Spatial Radius (default 8 km): all customer stops in a group must reside
 *      within the radius from the initial seed order of the cluster.
 *    - Vehicle Weight Limit (default 200 kg): cumulative cargo weight must not exceed vehicle capacity.
 *
 * 2. Route Optimization (OSRM Public Trip API):
 *    For each group, we compute the optimal TSP visit sequence starting from the FPO distribution hub
 *    using OSRM Trip API (source=first). It returns turn-by-turn road geometry (GeoJSON LineString),
 *    precise road distance in kilometers, and estimated drive time in minutes.
 *
 * 3. Graceful Fallback:
 *    If the public OSRM server is unreachable or rate-limited, the service computes a
 *    nearest-neighbour TSP route using the spherical Haversine formula, generates a direct
 *    GeoJSON path, estimates drive time at a realistic urban/rural speed of 25 km/h, and flags
 *    the route source as "estimated".
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface DispatchOrder {
  _id: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  totalWeightKg: number;
  items: any[];
  totalAmount: number;
}

export interface ProposedGroup {
  groupId: string;
  orders: DispatchOrder[];
  orderIds: string[];
  stopOrder: string[];
  totalWeightKg: number;
  totalDistanceKm: number;
  totalDurationMin: number;
  routeGeometry: {
    type: string;
    coordinates: number[][]; // [lng, lat]
  };
  source: 'osrm' | 'estimated';
}

/**
 * Great-circle distance using Haversine formula (km)
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Partition unassigned orders into vehicle groups using greedy proximity clustering.
 */
export function clusterOrdersByProximity(
  orders: DispatchOrder[],
  maxRadiusKm = 8,
  maxLoadKg = 200
): DispatchOrder[][] {
  const remaining = [...orders];
  const clusters: DispatchOrder[][] = [];

  while (remaining.length > 0) {
    const seed = remaining.shift()!;
    const cluster: DispatchOrder[] = [seed];
    let currentWeight = seed.totalWeightKg;

    let i = 0;
    while (i < remaining.length) {
      const candidate = remaining[i];
      const distFromSeed = haversineDistanceKm(
        seed.deliveryLat,
        seed.deliveryLng,
        candidate.deliveryLat,
        candidate.deliveryLng
      );

      if (distFromSeed <= maxRadiusKm && currentWeight + candidate.totalWeightKg <= maxLoadKg) {
        cluster.push(candidate);
        currentWeight += candidate.totalWeightKg;
        remaining.splice(i, 1);
      } else {
        i++;
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

/**
 * Optimize stop delivery sequence using OSRM Trip API with Haversine Nearest-Neighbour fallback.
 */
export async function optimizeGroupRoute(
  fpoHub: LatLng,
  groupOrders: DispatchOrder[]
): Promise<ProposedGroup> {
  const orderIds = groupOrders.map((o) => String(o._id));
  const totalWeightKg = groupOrders.reduce((sum, o) => sum + o.totalWeightKg, 0);

  // Attempt OSRM Public Trip API
  try {
    // Format: {lng},{lat};{lng},{lat}... starting with FPO Hub
    const coordinatesList = [
      `${fpoHub.lng},${fpoHub.lat}`,
      ...groupOrders.map((o) => `${o.deliveryLng},${o.deliveryLat}`),
    ].join(';');

    const url = `https://router.project-osrm.org/trip/v1/driving/${coordinatesList}?source=first&overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.trips && data.trips.length > 0) {
        const trip = data.trips[0];
        const waypoints = data.waypoints || [];

        // Map waypoints sequence to orders
        // Waypoint index 0 is FPO hub; waypoints 1..N correspond to input order indices
        const sortedWaypoints = [...waypoints]
          .filter((w) => w.waypoint_index > 0)
          .sort((a, b) => a.trips_index - b.trips_index);

        const stopOrder = sortedWaypoints.map((w) => {
          const originalOrderIndex = w.waypoint_index - 1;
          return orderIds[originalOrderIndex] || orderIds[0];
        });

        return {
          groupId: `grp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          orders: groupOrders,
          orderIds,
          stopOrder: stopOrder.length === orderIds.length ? stopOrder : orderIds,
          totalWeightKg,
          totalDistanceKm: Math.round((trip.distance / 1000) * 10) / 10,
          totalDurationMin: Math.round((trip.duration / 60) * 10) / 10,
          routeGeometry: trip.geometry,
          source: 'osrm',
        };
      }
    }
  } catch (err: any) {
    console.warn('[TraceCrop Dispatch] OSRM public trip API unavailable, using haversine fallback:', err.message);
  }

  // Graceful Fallback: Nearest-Neighbour TSP with Haversine
  return calculateHaversineFallback(fpoHub, groupOrders, orderIds, totalWeightKg);
}

function calculateHaversineFallback(
  fpoHub: LatLng,
  groupOrders: DispatchOrder[],
  orderIds: string[],
  totalWeightKg: number
): ProposedGroup {
  const unvisited = [...groupOrders];
  const stopOrder: string[] = [];
  const coords: number[][] = [[fpoHub.lng, fpoHub.lat]];
  let currentLat = fpoHub.lat;
  let currentLng = fpoHub.lng;
  let totalDistKm = 0;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = haversineDistanceKm(currentLat, currentLng, unvisited[i].deliveryLat, unvisited[i].deliveryLng);
      if (d < minDistance) {
        minDistance = d;
        nearestIdx = i;
      }
    }

    const nextStop = unvisited.splice(nearestIdx, 1)[0];
    stopOrder.push(String(nextStop._id));
    coords.push([nextStop.deliveryLng, nextStop.deliveryLat]);
    totalDistKm += minDistance;
    currentLat = nextStop.deliveryLat;
    currentLng = nextStop.deliveryLng;
  }

  // Assume avg urban/rural delivery speed of 25 km/h
  const totalDurationMin = Math.round((totalDistKm / 25) * 60);

  return {
    groupId: `grp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    orders: groupOrders,
    orderIds,
    stopOrder,
    totalWeightKg,
    totalDistanceKm: Math.round(totalDistKm * 10) / 10,
    totalDurationMin: Math.max(totalDurationMin, 10),
    routeGeometry: {
      type: 'LineString',
      coordinates: coords,
    },
    source: 'estimated',
  };
}
