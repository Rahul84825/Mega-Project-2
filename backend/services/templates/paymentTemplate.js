export const buildPaymentTemplate = (order, customer, isSuccess) => {
  const title = isSuccess ? "Payment Successful" : "Payment Failed";
  const subtitle = isSuccess 
    ? "We have successfully received your payment via Razorpay. Your order is now confirmed!" 
    : "There was an issue processing your payment. Your order remains pending. Please try again or switch to Cash on Delivery.";
  
  const icon = isSuccess ? '✅' : '❌';
  const accentColor = isSuccess ? '#4CAF50' : '#F44336';

  return `
    <div style="font-family: 'Georgia', serif; background-color: #FFFaf3; padding: 40px 20px; color: #3B2417;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8D5B7; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #8B1E3F; padding: 30px; text-align: center; border-bottom: 4px solid #F8B44A;">
          <h1 style="color: #F8B44A; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Mithai World</h1>
        </div>

        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="font-size: 50px; margin-bottom: 10px;">${icon}</div>
            <h2 style="color: ${accentColor}; margin: 0; font-size: 24px;">${title}</h2>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <p style="font-size: 16px; color: #A0836B; font-family: sans-serif; margin-bottom: 5px;">Order #${order.orderNumber}</p>
            <p style="color: #3B2417; line-height: 1.6; font-family: sans-serif; font-size: 16px;">${subtitle}</p>
          </div>

          <div style="background-color: #FFFaf3; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #E8D5B7; font-family: sans-serif;">
            <h4 style="margin: 0 0 15px; color: #8B1E3F; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; border-bottom: 1px solid #E8D5B7; padding-bottom: 10px;">Transaction Details</h4>
            <table style="width: 100%; font-size: 14px; color: #3B2417;">
              <tr>
                <td style="padding: 5px 0; color: #A0836B;">Amount Paid:</td>
                <td style="padding: 5px 0; text-align: right; font-weight: bold;">₹${order.totals?.grandTotal || '0'}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #A0836B;">Payment Method:</td>
                <td style="padding: 5px 0; text-align: right;">RAZORPAY</td>
              </tr>
              ${isSuccess && order.payment?.razorpayPaymentId ? `
              <tr>
                <td style="padding: 5px 0; color: #A0836B;">Transaction ID:</td>
                <td style="padding: 5px 0; text-align: right; font-family: monospace; font-size: 12px;">${order.payment.razorpayPaymentId}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          ${!isSuccess ? `
          <div style="text-align: center; margin-top: 30px;">
             <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout" 
                style="background-color: #8B1E3F; color: #F8B44A; text-decoration: none; padding: 15px 35px; border-radius: 8px; font-weight: bold; font-family: sans-serif; display: inline-block; text-transform: uppercase; letter-spacing: 1px; font-size: 13px;">
                Retry Payment
             </a>
          </div>
          ` : `
          <div style="text-align: center; margin-top: 30px;">
             <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.orderId || order._id}" 
                style="background-color: #8B1E3F; color: #F8B44A; text-decoration: none; padding: 15px 35px; border-radius: 8px; font-weight: bold; font-family: sans-serif; display: inline-block; text-transform: uppercase; letter-spacing: 1px; font-size: 13px;">
                View Order Details
             </a>
          </div>
          `}

        </div>

        <!-- Footer -->
        <div style="background-color: #FFFaf3; padding: 20px; text-align: center; border-top: 1px solid #E8D5B7;">
          <p style="margin: 0; color: #A0836B; font-family: sans-serif; font-size: 12px;">
            Need help? Contact our support at <a href="mailto:support@mithaiworld.com" style="color: #8B1E3F; text-decoration: none; font-weight: bold;">support@mithaiworld.com</a>
          </p>
        </div>
      </div>
    </div>
  `;
};
