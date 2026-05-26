export const buildOrderPlacedTemplate = (order, customer) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E8D5B7; color: #3B2417;">
        <span style="font-weight: 600;">${item.name}</span><br/>
        <span style="font-size: 12px; color: #A0836B;">Quantity: ${item.quantity}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #E8D5B7; color: #3B2417; text-align: right; font-weight: 600;">
        ₹${item.sellingPrice * item.quantity}
      </td>
    </tr>
  `).join('');

  const paymentMethodDisplay = order.payment.method;

  return `
    <div style="font-family: 'Georgia', serif; background-color: #FFFaf3; padding: 40px 20px; color: #3B2417;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8D5B7; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #8B1E3F; padding: 40px 30px; text-align: center; border-bottom: 4px solid #F8B44A;">
          <h1 style="color: #F8B44A; margin: 0; font-size: 32px; letter-spacing: 3px; text-transform: uppercase; font-weight: normal;">Mithai World</h1>
          <p style="color: #FFFFFF; margin: 10px 0 0; font-family: sans-serif; font-size: 14px; letter-spacing: 1px;">THE ART OF TRADITIONAL SWEETS</p>
        </div>

        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background-color: #F8B44A; color: #8B1E3F; padding: 6px 16px; border-radius: 20px; font-family: sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">
              Order Confirmed
            </div>
            <h2 style="color: #3B2417; margin: 0; font-size: 24px;">Namaste, ${customer.name}!</h2>
            <p style="color: #A0836B; line-height: 1.6; font-family: sans-serif; margin-top: 10px;">Your order has been received and is now being processed by our master chefs.</p>
          </div>
          
          <!-- Order Summary Card -->
          <div style="background-color: #FFFaf3; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #E8D5B7; position: relative;">
            <h3 style="margin-top: 0; color: #8B1E3F; border-bottom: 2px solid #E8D5B7; padding-bottom: 15px; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Order Summary <span style="font-size: 14px; color: #A0836B; float: right; font-weight: normal;">#${order.orderNumber}</span></h3>
            
            <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px; margin-top: 10px;">
              ${itemsHtml}
              <tr>
                <td style="padding: 15px 12px 5px; color: #A0836B;">Subtotal</td>
                <td style="padding: 15px 12px 5px; text-align: right; color: #3B2417;">₹${order.totals.subtotal}</td>
              </tr>
              ${order.totals.shippingFee > 0 ? `
              <tr>
                <td style="padding: 5px 12px; color: #A0836B;">Delivery Charges</td>
                <td style="padding: 5px 12px; text-align: right; color: #3B2417;">₹${order.totals.shippingFee}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 15px 12px; font-weight: bold; color: #8B1E3F; font-size: 18px; border-top: 2px solid #E8D5B7;">Total Amount</td>
                <td style="padding: 15px 12px; font-weight: bold; text-align: right; color: #8B1E3F; font-size: 18px; border-top: 2px solid #E8D5B7;">₹${order.totals.grandTotal}</td>
              </tr>
            </table>
          </div>

          <!-- Details Grid -->
          <div style="display: flex; flex-wrap: wrap; margin: 0 -10px; font-family: sans-serif;">
            <div style="flex: 1; min-width: 250px; padding: 10px;">
              <h4 style="margin: 0 0 10px; color: #8B1E3F; font-size: 14px; text-transform: uppercase;">Shipping Address</h4>
              <p style="margin: 0; font-size: 14px; color: #3B2417; line-height: 1.5;">
                ${order.shippingAddress.line1}<br/>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}
              </p>
            </div>
            <div style="flex: 1; min-width: 250px; padding: 10px;">
              <h4 style="margin: 0 0 10px; color: #8B1E3F; font-size: 14px; text-transform: uppercase;">Payment Details</h4>
              <p style="margin: 0; font-size: 14px; color: #3B2417; line-height: 1.5;">
                <strong>Method:</strong> ${paymentMethodDisplay}<br/>
                <strong>Status:</strong> ${order.payment.status}
              </p>
            </div>
          </div>

          <div style="margin-top: 40px; padding: 20px; background-color: #8B1E3F; border-radius: 8px; text-align: center;">
             <p style="margin: 0; color: #F8B44A; font-family: sans-serif; font-size: 14px; font-weight: bold;">
               Estimated Preparation Time: ${order.preparation?.etaMinutes || 15} Minutes
             </p>
          </div>
          
          <p style="color: #A0836B; line-height: 1.6; font-family: sans-serif; margin-top: 30px; text-align: center; font-style: italic;">
            We will notify you once your sweets are out for delivery. Thank you for choosing Mithai World!
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #FFFaf3; padding: 30px; text-align: center; border-top: 1px solid #E8D5B7;">
          <div style="margin-bottom: 20px;">
            <a href="#" style="color: #8B1E3F; text-decoration: none; margin: 0 10px; font-family: sans-serif; font-size: 12px; font-weight: bold;">WEBSITE</a>
            <a href="#" style="color: #8B1E3F; text-decoration: none; margin: 0 10px; font-family: sans-serif; font-size: 12px; font-weight: bold;">TRACK ORDER</a>
            <a href="#" style="color: #8B1E3F; text-decoration: none; margin: 0 10px; font-family: sans-serif; font-size: 12px; font-weight: bold;">SUPPORT</a>
          </div>
          <p style="margin: 0; color: #A0836B; font-family: sans-serif; font-size: 11px; letter-spacing: 0.5px;">
            © 2026 MITHAI WORLD. ALL RIGHTS RESERVED.<br/>
            123 Luxury Sweet Lane, Mithai Nagar, India
          </p>
        </div>
      </div>
    </div>
  `;
};
