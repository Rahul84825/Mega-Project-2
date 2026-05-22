import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { Parser } from "json2csv";
import { logger } from "../utils/logger.js";

export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const adminUsers = await User.countDocuments({ isAdmin: true });
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    
    // Revenue and Orders
    const orders = await Order.find({ status: { $ne: "REJECTED" } });
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totals?.grandTotal || o.total || 0), 0);
    const totalOrders = orders.length;

    // Daily Sales for chart (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $ne: "REJECTED" }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: { $ifNull: ["$totals.grandTotal", "$total"] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        adminUsers,
        totalProducts,
        totalCategories,
        totalRevenue,
        totalOrders,
        dailyStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error("Failed to fetch admin stats", { error: error.message });
    return next(error);
  }
};

export const getSalesReport = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    let query = { status: { $ne: "REJECTED" } };

    if (start && end) {
      query.createdAt = { $gte: new Date(start), $lte: new Date(end) };
    }

    const sales = await Order.find(query).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      data: sales
    });
  } catch (error) {
    return next(error);
  }
};

export const getCustomerReport = async (req, res, next) => {
  try {
    const customers = await User.find({ isAdmin: false }).sort({ createdAt: -1 });
    
    // Enrich with order count and total spent
    const enrichedCustomers = await Promise.all(customers.map(async (c) => {
      const orders = await Order.find({ "customer.email": c.email, status: "DELIVERED" });
      const totalSpent = orders.reduce((sum, o) => sum + (o.totals?.grandTotal || o.total || 0), 0);
      return {
        ...c.toObject(),
        orderCount: orders.length,
        totalSpent
      };
    }));

    return res.status(200).json({
      success: true,
      data: enrichedCustomers
    });
  } catch (error) {
    return next(error);
  }
};

export const downloadSalesReport = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    let query = { status: { $ne: "REJECTED" } };

    if (start && end) {
      query.createdAt = { $gte: new Date(start), $lte: new Date(end) };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    const fields = [
      { label: 'Order ID', value: 'orderNumber' },
      { label: 'Date', value: (row) => new Date(row.createdAt).toLocaleDateString() },
      { label: 'Customer Name', value: 'customer.name' },
      { label: 'Customer Email', value: 'customer.email' },
      { label: 'Status', value: 'status' },
      { label: 'Payment Method', value: 'payment.method' },
      { label: 'Total Amount', value: (row) => row.totals?.grandTotal || row.total || 0 }
    ];

    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(orders);

    res.header('Content-Type', 'text/csv');
    res.attachment(`sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    return next(error);
  }
};

export const downloadCustomerReport = async (req, res, next) => {
  try {
    const customers = await User.find({ isAdmin: false }).sort({ createdAt: -1 });
    
    const enrichedCustomers = await Promise.all(customers.map(async (c) => {
      const orders = await Order.find({ "customer.email": c.email, status: "DELIVERED" });
      const totalSpent = orders.reduce((sum, o) => sum + (o.totals?.grandTotal || o.total || 0), 0);
      return {
        name: c.name,
        email: c.email,
        createdAt: c.createdAt,
        orderCount: orders.length,
        totalSpent
      };
    }));

    const fields = [
      { label: 'Customer Name', value: 'name' },
      { label: 'Email', value: 'email' },
      { label: 'Joined At', value: (row) => new Date(row.createdAt).toLocaleDateString() },
      { label: 'Orders Completed', value: 'orderCount' },
      { label: 'Total Spent', value: 'totalSpent' }
    ];

    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(enrichedCustomers);

    res.header('Content-Type', 'text/csv');
    res.attachment(`customer_report_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    return next(error);
  }
};
