// Departments used across the app. Edit this list to match your shop.
// The reorder list and the PDF are grouped in exactly this order.
const DEPARTMENTS = [
  "Grocery",
  "Alcohol",
  "Tobacco",
  "Soft Drinks",
  "Confectionery",
  "Crisps & Snacks",
  "Chilled",
  "Frozen",
  "Bakery",
  "Household",
  "Toiletries",
  "News & Magazines",
  "Other"
];

// Product database.
// Each product: barcode, name, price (selling price), dept (must match a name above).
// You can also add products inside the app (saved on the phone), or import a CSV
// file from the Product Database section: barcode,name,price,department
const PRODUCTS = [
  { barcode: "5012345678901", name: "Coca-Cola Original Taste 500ml", price: 1.45, dept: "Soft Drinks" },
  { barcode: "5022822220249", name: "Maximum LED 1000W", price: 2.99, dept: "Household" },
  { barcode: "8700216332767", name: "Daz All in one PODs", price: 3.29, dept: "Toiletries" },
  { barcode: "5000431027572", name: "L&B Blue Original", price:15.95, dept: "Tobacco" },
  { barcode: "5053990188642", name: "Pringles Original", price:2.99, dept: "Crisps & Snacks" },
  { barcode: "5012345678902", name: "Pepsi 500ml", price: 1.35, dept: "Soft Drinks" },
  { barcode: "5012345678903", name: "Monster Energy Original 500ml", price: 1.79, dept: "Soft Drinks" },
  { barcode: "5012345678904", name: "Walkers Ready Salted Crisps 65g", price: 1.25, dept: "Crisps & Snacks" },
  { barcode: "5012345678905", name: "Cadbury Dairy Milk 110g", price: 2.25, dept: "Confectionery" },
  { barcode: "5012345678906", name: "Buldak Original 140g", price: 2.49, dept: "Grocery" },
  { barcode: "5012345678907", name: "Milka Alpine Milk 100g", price: 1.99, dept: "Confectionery" },
  { barcode: "5012345678908", name: "Red Bull 250ml", price: 1.65, dept: "Soft Drinks" },
  { barcode: "5012345678909", name: "Pringles Original 165g", price: 2.75, dept: "Crisps & Snacks" },
  { barcode: "5012345678910", name: "Evian Water 500ml", price: 1.10, dept: "Grocery" },
  { barcode: "8720181369599", name: "Lynx Gold", price: 4.50, dept: "Toiletries" },
  { barcode: "5000281005553", name: "Glen's Vodka 70cl", price: 16.99, dept: "Alcohol" },
  { barcode: "5011007003234", name: "Jameson Irish Whiskey 70cl", price: 24.99, dept: "Alcohol" },
  { barcode: "5000169062708", name: "Stella Artois 4x440ml", price: 6.50, dept: "Alcohol" },
  { barcode: "5000185002338", name: "Benson & Hedges Blue 20s", price: 15.60, dept: "Tobacco" },
  { barcode: "5000185004509", name: "Amber Leaf 30g", price: 22.50, dept: "Tobacco" },
  { barcode: "5000112637939", name: "Warburtons Toastie 800g", price: 1.75, dept: "Bakery" },
  { barcode: "5000436001234", name: "Fairy Washing Up Liquid 320ml", price: 1.80, dept: "Household" },
  { barcode: "5000157024671", name: "Heinz Baked Beans 415g", price: 1.30, dept: "Grocery" }
];
