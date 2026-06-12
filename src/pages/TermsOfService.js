export default function TermsOfService() {
  return (
    <div style={{ paddingTop:80, minHeight:'100vh', background:'var(--felt-dark)' }}>
      <div style={{ maxWidth:800, margin:'0 auto', padding:'3rem 1.5rem' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', color:'var(--gold)', marginBottom:'0.5rem' }}>Terms of Service</h1>
        <p style={{ color:'var(--text-muted)', marginBottom:'2rem', fontSize:'0.875rem' }}>Last updated: June 2026</p>

        {[
          { title:'1. Acceptance of Terms', content:`By accessing or using CardGamers.io, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service. We reserve the right to update these terms at any time.` },
          { title:'2. Account Registration', content:`You must create an account to access multiplayer features. You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information and keep it updated. One person may not maintain multiple accounts.` },
          { title:'3. Acceptable Use', content:`You agree to use CardGamers.io only for lawful purposes. You must not attempt to cheat, exploit bugs, or use automated tools to gain unfair advantages. You must not harass, abuse, or harm other players. Violations may result in account suspension or termination.` },
          { title:'4. Free and Premium Services', content:`CardGamers.io offers both free and paid (Plus/Club) subscription plans. Free users may see advertisements. Premium subscriptions are billed monthly and can be cancelled at any time. Refunds are provided within 7 days of purchase if you are not satisfied.` },
          { title:'5. No Real Money Gambling', content:`CardGamers.io is a free-to-play entertainment platform. No real money gambling takes place on this platform. Virtual chips and points have no real-world monetary value and cannot be exchanged for cash or prizes.` },
          { title:'6. Intellectual Property', content:`All content on CardGamers.io, including game designs, graphics, and code, is owned by CardGamers.io or its licensors. You may not copy, reproduce, or distribute our content without written permission.` },
          { title:'7. Advertisements', content:`Free users will see advertisements served by Google AdSense. These ads are provided by third parties and CardGamers.io is not responsible for their content. Plus subscribers enjoy an ad-free experience.` },
          { title:'8. Disclaimers', content:`CardGamers.io is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service. We are not responsible for any losses resulting from use of our platform.` },
          { title:'9. Limitation of Liability', content:`CardGamers.io shall not be liable for any indirect, incidental, or consequential damages arising from your use of our platform. Our total liability shall not exceed the amount you paid us in the past 12 months.` },
          { title:'10. Governing Law', content:`These Terms are governed by the laws of India. Any disputes shall be resolved through binding arbitration in Chennai, Tamil Nadu, India.` },
          { title:'11. Contact', content:`For questions about these Terms, contact us at support@cardgamers.io` },
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
