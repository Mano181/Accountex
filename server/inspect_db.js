require('dotenv').config();
const db = require('./db');

const inspect = async () => {
    try {
        const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'transactions'");
        console.log("Transactions Table Columns:");
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

inspect();
