
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const dataDirectory = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDirectory, "listings.json");

function readListings() {
  if (!fs.existsSync(dataFile)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
    fs.writeFileSync(dataFile, "[]", "utf8");
  }

  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function saveListings(listings) {
  fs.writeFileSync(
    dataFile,
    JSON.stringify(listings, null, 2),
    "utf8"
  );
}

// Get all produce listings
router.get("/", (req, res) => {
  try {
    res.json({ success: true, listings: readListings() });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not read produce listings.",
    });
  }
});

// Add a produce listing
router.post("/", (req, res) => {
  try {
    const { name, quantity, price, harvestDate, location } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof location !== "string" ||
      !location.trim() ||
      typeof harvestDate !== "string" ||
      !harvestDate.trim() ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(price) ||
      quantity <= 0 ||
      price <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a name, location, harvest date, valid quantity, and valid price.",
      });
    }

    const listings = readListings();

    const newListing = {
      id: Date.now().toString(),
      name: name.trim(),
      quantity,
      price,
      harvestDate,
      location: location.trim(),
      createdAt: new Date().toISOString(),
    };

    listings.unshift(newListing);
    saveListings(listings);

    res.status(201).json({
      success: true,
      listing: newListing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not save the produce listing.",
    });
  }
});

// Delete a produce listing
router.delete("/:id", (req, res) => {
  try {
    const listings = readListings();
    const updatedListings = listings.filter(
      (listing) => listing.id !== req.params.id
    );

    if (updatedListings.length === listings.length) {
      return res.status(404).json({
        success: false,
        message: "Listing not found.",
      });
    }

    saveListings(updatedListings);

    res.json({
      success: true,
      message: "Listing deleted.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not delete the listing.",
    });
  }
});

module.exports = router;
