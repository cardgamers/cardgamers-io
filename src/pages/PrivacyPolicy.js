export default function PrivacyPolicy() {
  return (
    <div style={{ paddingTop:80, minHeight:'100vh', background:'var(--felt-dark)' }}>
      <div style={{ maxWidth:800, margin:'0 auto', padding:'3rem 1.5rem' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', color:'var(--gold)', marginBottom:'0.5rem' }}>Privacy Policy</h1>
        <p style={{ color:'var(--text-muted)', marginBottom:'2rem', fontSize:'0.875rem' }}>Last updated: June 2026</p>

        {[
          { title:'1. Information We Collect', content:`We collect information you provide when creating an account, including your username and email address. We also collect gameplay data such as game history, scores, and ratings. We use cookies and similar technologies to maintain your session and improve your experience.` },
          { title:'2. How We Use Your Information', content:`We use your information to provide and improve our card game services, personalise your experience, send account-related emails such as verification and password resets, and display relevant advertising through Google AdSense.` },
          { title:'3. Google AdSense', content:`We use Google AdSense to display advertisements. Google may use cookies to serve ads based on your prior visits to our website or other websites. You may opt out of personalised advertising by visiting Google's Ads Settings at www.google.com/settings/ads.` },
          { title:'4. Data Sharing', content:`We do not sell your personal data. We share data only with service providers necessary to operate our platform, including Supabase (database), Vercel (hosting), and Google (analytics and advertising). All providers are bound by strict data protection agreements.` },
          { title:'5. Data Security', content:`We implement industry-standard security measures to protect your data. Your password is encrypted and never stored in plain text. We use HTTPS encryption for all data transmission.` },
          { title:'6. Your Rights', content:`You have the right to access, correct, or delete your personal data at any time. To request deletion of your account and data, contact us at support@cardgamers.io. We will process your request within 30 days.` },
          { title:'7. Children\'s Privacy', content:`CardGamers.io is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.` },
          { title:'8. Cookies', content:`We use essential cookies to keep you logged in and remember your preferences. We also use Google Analytics cookies to understand how visitors use our site. You can control cookie settings through your browser.` },
          { title:'9. Changes to This Policy', content:`We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on our website. Continued use of CardGamers.io after changes constitutes acceptance of the updated policy.` },
          { title:'10. Contact Us', content:`If you have questions about this Privacy Policy, please contact us at support@cardgamers.io` },
        ].map(({ title, content }) => (
          <div key={title} style={{ marginBottom:'1.75rem' }}>
            <h2 style={{ fontSize:'1.1rem', fontWeight:600, color:'var(--cream)', marginBottom:'0.5rem' }}>{title}</h2>
            <p style={{ color:'var(--text-muted)', lineHeight:1.8, fontSize:'0.95rem' }}>{content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
