import PurchaseOrder from '../models/PurchaseOrder.js';
import Vendor from '../models/Vendor.js';

// Aggregate spend over time (grouped by month)
export const getSpendingReport = async (req, res) => {
  try {
    const data = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSpend: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Map to simple JSON elements for charting (e.g. period: "2024-05")
    const formatted = data.map((item) => {
      const monthStr = String(item._id.month).padStart(2, '0');
      return {
        period: `${item._id.year}-${monthStr}`,
        amount: parseFloat(item.totalSpend.toFixed(2)),
        count: item.orderCount
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error calculating spending trends:', error);
    res.status(500).json({ message: 'Error generating spending reports' });
  }
};

// Aggregate spend and volume per vendor
export const getVendorReport = async (req, res) => {
  try {
    const data = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: '$vendorId',
          totalSpend: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const populated = await Vendor.populate(data, {
      path: '_id',
      select: 'companyName category'
    });

    const formatted = populated.map((item) => ({
      vendorId: item._id?._id || null,
      vendorName: item._id?.companyName || 'Unknown Vendor',
      category: item._id?.category || 'General',
      amount: parseFloat(item.totalSpend.toFixed(2)),
      count: item.orderCount
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error calculating vendor distributions:', error);
    res.status(500).json({ message: 'Error generating vendor reports' });
  }
};
