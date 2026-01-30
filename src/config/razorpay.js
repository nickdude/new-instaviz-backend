const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createOrder = async ({ amount, currency, receipt, notes }) => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are missing");
  }

  return await razorpay.orders.create({
    amount,
    currency,
    receipt,
    notes
  });
};

module.exports = {
  razorpay,
  createOrder
};
