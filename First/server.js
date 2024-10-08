const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Product = require('./models/Product'); // Import product model

const app = express();
const PORT = 3000;


const getMonthNumber = (month) => {
    const months = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12,
    };
    return months[month];
};


// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/productsDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB', err);
});

app.get('/seed-database', async (req, res) => {
    try {
        // Fetch data from third-party API
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const products = response.data;

        // Delete existing data to avoid duplicates
        await Product.deleteMany({});

        // Insert fetched data into the database
        await Product.insertMany(products);

        res.status(200).send('Database seeded successfully with product data!');
    } catch (error) {
        console.error('Error seeding the database:', error);
        res.status(500).send('Error seeding the database');
    }
});
app.get('/sales/total', async (req, res) => {
    try {
        const month = getMonthNumber(req.query.month); // Get month from query parameter
        const year = parseInt(req.query.year); // Get year from query parameter

        const matchCriteria = {};
        if (month) matchCriteria.month = month;
        if (year) matchCriteria.year = year;

        const totalSales = await Product.aggregate([
            {
                $project: {
                    month: { $month: "$dateOfSale" },
                    year: { $year: "$dateOfSale" },
                    price: 1,
                }
            },
            {
                $match: matchCriteria
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$price" }
                }
            }
        ]);

        res.status(200).json({
            totalSales: totalSales[0]?.totalSales || 0
        });
    } catch (error) {
        console.error('Error fetching total sales:', error);
        res.status(500).send('Error fetching total sales');
    }
});

app.get('/sales/items', async (req, res) => {
    try {
        const month = getMonthNumber(req.query.month); // Get month from query parameter
        const year = parseInt(req.query.year); // Get year from query parameter

        const matchCriteria = {};
        if (month) matchCriteria.month = month;
        if (year) matchCriteria.year = year;

        const totalItems = await Product.aggregate([
            {
                $project: {
                    month: { $month: "$dateOfSale" },
                    year: { $year: "$dateOfSale" },
                    quantity: 1,
                }
            },
            {
                $match: matchCriteria
            },
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: "$quantity" }
                }
            }
        ]);

        res.status(200).json({
            totalItems: totalItems[0]?.totalItems || 0
        });
    } catch (error) {
        console.error('Error fetching total items sold:', error);
        res.status(500).send('Error fetching total items sold');
    }
});

app.get('/sales/average-transaction', async (req, res) => {
    try {
        const month = getMonthNumber(req.query.month); // Get month from query parameter
        const year = parseInt(req.query.year); // Get year from query parameter

        const matchCriteria = {};
        if (month) matchCriteria.month = month;
        if (year) matchCriteria.year = year;

        const avgTransaction = await Product.aggregate([
            {
                $project: {
                    month: { $month: "$dateOfSale" },
                    year: { $year: "$dateOfSale" },
                    price: 1,
                }
            },
            {
                $match: matchCriteria
            },
            {
                $group: {
                    _id: null,
                    averageTransaction: { $avg: "$price" }
                }
            }
        ]);

        res.status(200).json({
            averageTransaction: avgTransaction[0]?.averageTransaction || 0
        });
    } catch (error) {
        console.error('Error fetching average transaction amount:', error);
        res.status(500).send('Error fetching average transaction amount');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});