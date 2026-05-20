export const buildAdminAlertTemplate = (order, customer) => {
  return `
    <div style="font-family: 'Georgia', serif; background-color: #FFFaf3; padding: 40px 20px; color: #3B2417;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8D5B7; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
        
        <div style="background-color: #8B1E3F; padding: 30px; text-align: center;">
          <h1 style="color: #F8B44A; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">New Order Received</h1>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="color: #3B2417; margin-top: 0;">Order Summary (#${order.orderNumber})</h2>
          
          <div style="background-color: #FFFaf3; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #E8D5B7;">
            <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #E8D5B7; color: #3B2417;"><strong>Customer</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #E8D5B7; text-align: right; color: #3B2417;">${customer.name || 'Guest'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #E8D5B7; color: #3B2417;"><strong>Amount</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #E8D5B7; text-align: right; color: #8B1E3F; font-weight: bold;">₹${order.totals?.grandTotal || '0'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #E8D5B7; color: #3B2417;"><strong>Payment</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #E8D5B7; text-align: right; color: #3B2417;">${order.payment?.method || 'COD'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; color: #3B2417;"><strong>Items</strong></td>
                <td style="padding: 10px; text-align: right; color: #3B2417;">${order.items?.length || 0} items</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/orders" 
               style="background-color: #8B1E3F; color: #F8B44A; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
               Manage Order
            </a>
          </div>
        </div>

        <div style="background-color: #FFFaf3; padding: 20px; text-align: center; border-top: 1px solid #E8D5B7;">
          <p style="margin: 0; color: #A0836B; font-family: sans-serif; font-size: 12px;">Mithai World Admin Notification System</p>
        </div>
      </div>
    </div>
  `;
};
