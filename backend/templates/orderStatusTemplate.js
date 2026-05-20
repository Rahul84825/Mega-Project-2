export const buildOrderStatusTemplate = (order, customer, title, subtitle) => {
  const statusColors = {
    'PLACED': '#F8B44A',
    'ACCEPTED': '#4CAF50',
    'PREPARING': '#F8B44A',
    'READY': '#4CAF50',
    'PICKED_UP': '#2196F3',
    'DELIVERED': '#4CAF50',
    'REJECTED': '#F44336'
  };

  const currentStatusColor = statusColors[order.status] || '#8B1E3F';

  return `
    <div style="font-family: 'Georgia', serif; background-color: #FFFaf3; padding: 40px 20px; color: #3B2417;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8D5B7; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #8B1E3F; padding: 30px; text-align: center; border-bottom: 4px solid #F8B44A;">
          <h1 style="color: #F8B44A; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Mithai World</h1>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="color: #3B2417; margin-top: 0; text-align: center; font-size: 22px;">${title}</h2>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 16px; color: #A0836B; font-family: sans-serif; margin-bottom: 5px;">Order #${order.orderNumber}</p>
            <p style="color: #3B2417; line-height: 1.6; font-family: sans-serif; font-size: 18px;">${subtitle}</p>
          </div>

          <!-- Status Badge -->
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 12px 30px; border-radius: 30px; background-color: #FFFaf3; border: 2px solid ${currentStatusColor};">
              <span style="color: ${currentStatusColor}; font-weight: bold; font-family: sans-serif; text-transform: uppercase; letter-spacing: 2px; font-size: 14px;">
                ${order.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          ${order.status === 'REJECTED' && order.rejectionReason ? `
          <div style="margin-top: 20px; padding: 20px; border-radius: 8px; background-color: #FFF3E0; border: 1px solid #FFE0B2; font-family: sans-serif; font-size: 14px; color: #3B2417; text-align: center;">
            <strong style="color: #D32F2F;">Note:</strong> ${order.rejectionReason}
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 40px;">
             <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.orderId || order._id}" 
                style="background-color: #8B1E3F; color: #F8B44A; text-decoration: none; padding: 15px 35px; border-radius: 8px; font-weight: bold; font-family: sans-serif; display: inline-block; text-transform: uppercase; letter-spacing: 1px; font-size: 13px;">
                Track Your Order
             </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #FFFaf3; padding: 20px; text-align: center; border-top: 1px solid #E8D5B7;">
          <p style="margin: 0; color: #A0836B; font-family: sans-serif; font-size: 12px;">
            Questions? Contact us at <a href="mailto:support@mithaiworld.com" style="color: #8B1E3F; text-decoration: none; font-weight: bold;">support@mithaiworld.com</a>
          </p>
        </div>
      </div>
    </div>
  `;
};
