/**
 * Template for Admin: New Contact Form Submission
 */
export const buildAdminContactAlert = (inquiry) => {
  return `
    <div style="font-family: 'Georgia', serif; background-color: #FFFaf3; padding: 40px 20px; color: #3B2417;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8D5B7; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
        
        <div style="background-color: #8B1E3F; padding: 30px; text-align: center;">
          <h1 style="color: #F8B44A; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">New Inquiry Alert</h1>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="color: #3B2417; margin-top: 0; font-size: 20px;">Customer Message Details</h2>
          
          <div style="background-color: #FFFaf3; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #E8D5B7; font-family: sans-serif; font-size: 14px;">
            <p style="margin: 8px 0; color: #8B1E3F;"><strong>Name:</strong> ${inquiry.name}</p>
            <p style="margin: 8px 0; color: #8B1E3F;"><strong>Email:</strong> ${inquiry.email}</p>
            <p style="margin: 8px 0; color: #8B1E3F;"><strong>Phone:</strong> ${inquiry.phone || 'N/A'}</p>
            <p style="margin: 8px 0; color: #8B1E3F;"><strong>Subject:</strong> ${inquiry.subject || 'Store Inquiry'}</p>
            <hr style="border: none; border-top: 1px solid #E8D5B7; margin: 20px 0;" />
            <p style="margin: 0; line-height: 1.6; color: #3B2417;"><strong>Message:</strong><br/><i style="color: #A0836B;">"${inquiry.message}"</i></p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${inquiry.email}" style="background-color: #8B1E3F; color: #F8B44A; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-family: sans-serif; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
              Direct Reply
            </a>
          </div>
        </div>

        <div style="background-color: #FFFaf3; padding: 20px; text-align: center; border-top: 1px solid #E8D5B7;">
          <p style="margin: 0; color: #A0836B; font-family: sans-serif; font-size: 11px; letter-spacing: 0.5px;">Mithai World | Internal Notification</p>
        </div>
      </div>
    </div>
  `;
};

/**
 * Template for Customer: Acknowledgment of Contact Form
 */
export const buildCustomerContactAck = (inquiry) => {
  return `
    <div style="font-family: 'Georgia', serif; background-color: #FFFaf3; padding: 40px 20px; color: #3B2417;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8D5B7; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
        
        <div style="background-color: #8B1E3F; padding: 30px; text-align: center; border-bottom: 4px solid #F8B44A;">
          <h1 style="color: #F8B44A; margin: 0; font-size: 28px; letter-spacing: 3px; text-transform: uppercase;">Mithai World</h1>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="color: #3B2417; margin-top: 0; text-align: center;">Namaste ${inquiry.name},</h2>
          <p style="color: #A0836B; line-height: 1.6; font-family: sans-serif; text-align: center; font-size: 16px;">
            Thank you for reaching out to us. We have received your inquiry regarding <strong>"${inquiry.subject || 'General Assistance'}"</strong>.
          </p>
          
          <div style="margin: 30px 0; text-align: center;">
            <p style="font-family: sans-serif; color: #3B2417; font-size: 14px;">
              Our concierge team is reviewing your message and will get back to you within 24 business hours.
            </p>
          </div>

          <div style="background-color: #FFFaf3; border-radius: 12px; padding: 20px; border: 1px solid #E8D5B7;">
             <p style="margin: 0; color: #8B1E3F; font-size: 12px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Your Message Summary:</p>
             <p style="margin: 0; color: #A0836B; font-family: sans-serif; font-size: 14px; line-height: 1.5; font-style: italic;">
               "${inquiry.message.substring(0, 200)}${inquiry.message.length > 200 ? '...' : ''}"
             </p>
          </div>

          <div style="text-align: center; margin-top: 40px;">
             <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
                style="background-color: #8B1E3F; color: #F8B44A; text-decoration: none; padding: 15px 35px; border-radius: 8px; font-weight: bold; font-family: sans-serif; display: inline-block; text-transform: uppercase; letter-spacing: 1px; font-size: 13px;">
                Explore Our Collection
             </a>
          </div>
        </div>

        <div style="background-color: #FFFaf3; padding: 30px; text-align: center; border-top: 1px solid #E8D5B7;">
          <p style="margin: 0; color: #A0836B; font-family: sans-serif; font-size: 11px; letter-spacing: 0.5px;">
            © 2026 MITHAI WORLD. CRAFTING TRADITIONS.<br/>
            Need immediate help? Call us at +91 99999 88888
          </p>
        </div>
      </div>
    </div>
  `;
};
