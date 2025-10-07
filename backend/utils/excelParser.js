const xlsx = require('xlsx');

const parseExcel = (filePath) => {
  try {
    // Parse the Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);

    
    // Map the Excel data to your product model structure
    const products = data.map((row) => ({
      productCategoryId: row['Category ID'],
      departmentId: row['Department ID'],
      name: row['Product Name'],
      slug: row['Slug'] || row['Product Name'].toLowerCase().replace(/\s+/g, '-'),
      description: row['Description'] || '',
      quantity: parseInt(row['Quantity'] || 0, 10),
      price: parseFloat(row['Price'] || 0),
      stockStatus: mapStockStatus(row['Stock Status']),
      hasVariant: Boolean(row['Has Variant']) || false,
      // Add other fields as needed
    }));

    return products;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse Excel file');
  }
};

const mapStockStatus = (status) => {
  const statusMap = {
    'in stock': 'in_stock',
    'out of stock': 'out_of_stock',
    'low stock': 'low_stock'
  };
  return statusMap[status?.toLowerCase()] || 'in_stock';
};

module.exports = { parseExcel };
