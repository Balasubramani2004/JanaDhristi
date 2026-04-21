/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * DPDP Act 2023 Compliant Privacy Policy
 */

import type { Metadata } from "next";
import Link from "next/link";
import LegalPageHeader from "@/components/common/LegalPageHeader";

export const metadata: Metadata = {
  title: "Privacy Policy — JanaDhristi",
  description:
    "How JanaDhristi handles your data. Fully compliant with India's Digital Personal Data Protection (DPDP) Act, 2023.",
  alternates: { canonical: "https://janadhristi.in/en/privacy" },
};

const section: React.CSSProperties = { marginBottom: 24 };
const h2Style: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 8, marginTop: 0,
};
const pStyle: React.CSSProperties = { fontSize: 14, color: "#4B4B4B", lineHeight: 1.7, margin: "0 0 10px" };
const tableStyle: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 12,
};
const thStyle: React.CSSProperties = {
  textAlign: "left", padding: "8px 10px", background: "#F5F5F0",
  fontWeight: 600, color: "#1A1A1A", borderBottom: "1px solid #E8E8E4",
};
const tdStyle: React.CSSProperties = {
  padding: "8px 10px", borderBottom: "1px solid #F0F0EC", color: "#3A3A3A",
  verticalAlign: "top",
};

export default function PrivacyPage() {
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 60px" }}>
        <LegalPageHeader title="Privacy Policy" lastUpdated="16 April 2026" />

        {/* 1. About */}
        <div style={section}>
          <h2 style={h2Style}>1. About This Policy</h2>
          <p style={pStyle}>
            JanaDhristi is an independent citizen transparency platform built by <strong>Jayanth M B</strong> in Bengaluru, Karnataka, India. It is not an official government website. This Privacy Policy explains how we collect, process, and protect your personal data, in compliance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>.
          </p>
          <p style={pStyle}>By using this platform, you agree to the practices described below.</p>
          <p style={pStyle}>
            Operator: Jayanth M B, Bengaluru, Karnataka, India<br />
            Contact: <a href="mailto:support@janadhristi.in" style={{ color: "#2563EB" }}>support@janadhristi.in</a>
          </p>
        </div>

        {/* 2. What Data We Process */}
        <div style={section}>
          <h2 style={h2Style}>2. What Data We Process</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>What Exactly</th>
                  <th style={thStyle}>Purpose</th>
                  <th style={thStyle}>Legal Basis under DPDP Act</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>Vote fingerprint</td>
                  <td style={tdStyle}>SHA-256 hash of IP + browser user-agent (not reversible)</td>
                  <td style={tdStyle}>Prevent duplicate votes on the features page</td>
                  <td style={tdStyle}>Legitimate interest (platform integrity)</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Feedback email</td>
                  <td style={tdStyle}>Email you voluntarily enter in the feedback form</td>
                  <td style={tdStyle}>Respond to your feedback</td>
                  <td style={tdStyle}>Your consent</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Supporter info</td>
                  <td style={tdStyle}>Name, email, contribution amount, optional social handle</td>
                  <td style={tdStyle}>Process contributions, display on contributor page if opted in</td>
                  <td style={tdStyle}>Contractual necessity + consent</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Payment details</td>
                  <td style={tdStyle}>Card, UPI, bank details — processed entirely by Razorpay. We never see or store these.</td>
                  <td style={tdStyle}>Complete your contribution</td>
                  <td style={tdStyle}>Contractual necessity</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Server logs</td>
                  <td style={tdStyle}>IP address, browser type, request URL, timestamp</td>
                  <td style={tdStyle}>Security, abuse prevention, debugging</td>
                  <td style={tdStyle}>Legitimate interest</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Error logs (Sentry)</td>
                  <td style={tdStyle}>Stack traces, browser type, URL. No personal identifiers captured.</td>
                  <td style={tdStyle}>Fix bugs</td>
                  <td style={tdStyle}>Legitimate interest</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Analytics (Plausible)</td>
                  <td style={tdStyle}>Aggregated page views, referrer country. No cookies, no personal identifiers.</td>
                  <td style={tdStyle}>Understand which districts and modules are useful</td>
                  <td style={tdStyle}>Legitimate interest</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. What We Do NOT Collect */}
        <div style={section}>
          <h2 style={h2Style}>3. What We Do NOT Collect</h2>
          {[
            "Aadhaar, PAN, voter ID, driving licence, or any government-issued ID",
            "Personal data of citizens from government portals (we only collect aggregated/statistical data)",
            "Cookies — zero cookies of any kind on this platform",
            "Tracking pixels or third-party advertising trackers",
            "Location data (GPS or precise geolocation)",
            "Biometric data",
            "Financial account numbers or credit card details",
            "Your contacts, photos, or device storage",
          ].map((item) => (
            <p key={item} style={{ ...pStyle, margin: "0 0 6px" }}>
              <span style={{ color: "#DC2626", fontWeight: 600 }}>&#x2717;</span>{" "}{item}
            </p>
          ))}
          <p style={{ ...pStyle, marginTop: 10, fontWeight: 600 }}>
            We do NOT sell, rent, license, or share your data with advertisers or data brokers.
          </p>
        </div>

        {/* 4. Data Retention */}
        <div style={section}>
          <h2 style={h2Style}>4. Data Retention</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>How Long</th>
                  <th style={thStyle}>Why</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>Feedback</td>
                  <td style={tdStyle}>12 months from submission</td>
                  <td style={tdStyle}>Support and follow-up, then deleted</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Vote fingerprints</td>
                  <td style={tdStyle}>Until the feature is built, shipped, or removed — max 24 months</td>
                  <td style={tdStyle}>Prevent duplicate voting</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Supporter data</td>
                  <td style={tdStyle}>7 years minimum</td>
                  <td style={tdStyle}>Indian Income Tax Act record-keeping requirement</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Server logs</td>
                  <td style={tdStyle}>30 days</td>
                  <td style={tdStyle}>Vercel platform default; security investigations</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Error logs (Sentry)</td>
                  <td style={tdStyle}>90 days</td>
                  <td style={tdStyle}>Debugging</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Analytics (Plausible)</td>
                  <td style={tdStyle}>Aggregated indefinitely; individual visit data not retained</td>
                  <td style={tdStyle}>Analysis is stateless</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Your Rights Under DPDP Act, 2023 */}
        <div style={section}>
          <h2 style={h2Style}>5. Your Rights Under DPDP Act, 2023</h2>
          <p style={pStyle}>You have the following rights over your personal data:</p>
          <ul style={{ ...pStyle, paddingLeft: 20, margin: "0 0 12px" }}>
            <li style={{ marginBottom: 6 }}><strong>Right to Access:</strong> Request a copy of what we hold about you</li>
            <li style={{ marginBottom: 6 }}><strong>Right to Correction:</strong> Request correction of inaccurate data</li>
            <li style={{ marginBottom: 6 }}><strong>Right to Erasure:</strong> Request deletion of your data (subject to legal retention requirements)</li>
            <li style={{ marginBottom: 6 }}><strong>Right to Withdraw Consent:</strong> Withdraw previously given consent at any time (this does not affect processing that occurred before withdrawal)</li>
            <li style={{ marginBottom: 6 }}><strong>Right to Grievance Redressal:</strong> Raise concerns about our data practices and receive a response</li>
            <li style={{ marginBottom: 6 }}><strong>Right to Nominate:</strong> Nominate another individual to exercise these rights in case of your death or incapacity</li>
          </ul>
          <p style={pStyle}>
            <strong>How to exercise:</strong> Email <a href="mailto:support@janadhristi.in" style={{ color: "#2563EB" }}>support@janadhristi.in</a> with the subject line <strong>&quot;DPDP Data Request&quot;</strong>. We will respond within 30 days. If you are unsatisfied with our response, you have the right to file a complaint with the <strong>Data Protection Board of India</strong>.
          </p>
        </div>

        {/* 6. Grievance Officer */}
        <div style={section}>
          <h2 style={h2Style}>6. Grievance Officer</h2>
          <p style={pStyle}>Under DPDP Act 2023, we have designated the following as our Grievance Officer:</p>
          <ul style={{ ...pStyle, paddingLeft: 20, margin: "0 0 12px" }}>
            <li style={{ marginBottom: 6 }}><strong>Name:</strong> Jayanth M B</li>
            <li style={{ marginBottom: 6 }}><strong>Role:</strong> Founder &amp; Data Fiduciary Contact</li>
            <li style={{ marginBottom: 6 }}><strong>Email:</strong> <a href="mailto:support@janadhristi.in" style={{ color: "#2563EB" }}>support@janadhristi.in</a></li>
            <li style={{ marginBottom: 6 }}><strong>Response time:</strong> Within 30 days of receipt</li>
          </ul>
        </div>

        {/* 7. Children's Data */}
        <div style={section}>
          <h2 style={h2Style}>7. Children&apos;s Data</h2>
          <p style={pStyle}>
            JanaDhristi is not directed at children under 18. We do not knowingly collect personal data from minors. Feature voting uses anonymous fingerprints that cannot identify individuals, including minors. If you are a parent or guardian and believe a child has submitted personal data (for example, via the feedback form), please contact us immediately at <a href="mailto:support@janadhristi.in" style={{ color: "#2563EB" }}>support@janadhristi.in</a> and we will delete it within 72 hours.
          </p>
          <p style={pStyle}>
            Under DPDP Act 2023, we do not engage in targeted advertising or behavioural monitoring of children.
          </p>
        </div>

        {/* 8. Cross-Border Data Transfers */}
        <div style={section}>
          <h2 style={h2Style}>8. Cross-Border Data Transfers</h2>
          <p style={pStyle}>Some of our processors store or process data on servers outside India. We disclose these clearly:</p>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Processor</th>
                  <th style={thStyle}>Purpose</th>
                  <th style={thStyle}>Data Location</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>Vercel</td>
                  <td style={tdStyle}>Hosting</td>
                  <td style={tdStyle}>Global edge + US origin</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Razorpay</td>
                  <td style={tdStyle}>Payments</td>
                  <td style={tdStyle}>India</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Neon</td>
                  <td style={tdStyle}>Database</td>
                  <td style={tdStyle}>Can be configured per region; currently hosted in an Asia region</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Upstash</td>
                  <td style={tdStyle}>Cache</td>
                  <td style={tdStyle}>Global (AWS regions)</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Plausible</td>
                  <td style={tdStyle}>Analytics</td>
                  <td style={tdStyle}>EU (Germany)</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Resend</td>
                  <td style={tdStyle}>Admin email</td>
                  <td style={tdStyle}>US</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Sentry</td>
                  <td style={tdStyle}>Error logs</td>
                  <td style={tdStyle}>US</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={pStyle}>
            These transfers are made under contractual safeguards with each processor. The Government of India may from time to time restrict certain countries for cross-border transfers under DPDP Act 2023; we will update this list if that happens.
          </p>
        </div>

        {/* 9. Automated Decision-Making and AI Processing */}
        <div style={section}>
          <h2 style={h2Style}>9. Automated Decision-Making and AI Processing</h2>
          <p style={pStyle}>We use automated systems and AI models for:</p>
          <ul style={{ ...pStyle, paddingLeft: 20, margin: "0 0 12px" }}>
            <li style={{ marginBottom: 6 }}>News classification (assigning news articles to relevant modules such as Infrastructure, Elections, Health)</li>
            <li style={{ marginBottom: 6 }}>AI insights and summaries on each module page</li>
            <li style={{ marginBottom: 6 }}>Data fact-checking and confidence scoring</li>
          </ul>
          <p style={pStyle}>
            These systems do not make decisions that produce legal or significant effects on you as an individual — they only classify and summarise public information. If you believe an AI-generated summary is incorrect or unfair to you, please report it via feedback and we will review within 24 hours.
          </p>
        </div>

        {/* 10. Data Security */}
        <div style={section}>
          <h2 style={h2Style}>10. Data Security</h2>
          <ul style={{ ...pStyle, paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 6 }}>AES-256 encryption for sensitive data at rest</li>
            <li style={{ marginBottom: 6 }}>TLS 1.2+ (HTTPS) for all data in transit</li>
            <li style={{ marginBottom: 6 }}>Two-factor authentication (Google Authenticator TOTP) on the admin panel</li>
            <li style={{ marginBottom: 6 }}>HMAC-SHA256 payment signature verification for all Razorpay webhooks</li>
            <li style={{ marginBottom: 6 }}>No plaintext passwords anywhere in our systems</li>
            <li style={{ marginBottom: 6 }}>IP-based admin panel access restriction</li>
          </ul>
        </div>

        {/* 11. Data Breach Notification */}
        <div style={section}>
          <h2 style={h2Style}>11. Data Breach Notification</h2>
          <p style={pStyle}>
            In the event of a personal data breach that is likely to result in risk to you, we will notify affected users within <strong>72 hours</strong> of becoming aware of the breach, as required under DPDP Act 2023. Notifications will include the nature of the breach, data affected, actions being taken, and steps you can take to protect yourself. We will also notify the Data Protection Board of India within the required timeframe.
          </p>
        </div>

        {/* 12. Third-Party Services */}
        <div style={section}>
          <h2 style={h2Style}>12. Third-Party Services</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Service</th>
                  <th style={thStyle}>Purpose</th>
                  <th style={thStyle}>Privacy Policy</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>Vercel</td>
                  <td style={tdStyle}>Hosting &amp; deployment</td>
                  <td style={tdStyle}><a href="https://vercel.com/legal/privacy-policy" style={{ color: "#2563EB" }} target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a></td>
                </tr>
                <tr>
                  <td style={tdStyle}>Razorpay</td>
                  <td style={tdStyle}>Payment processing</td>
                  <td style={tdStyle}><a href="https://razorpay.com/privacy/" style={{ color: "#2563EB" }} target="_blank" rel="noopener noreferrer">razorpay.com/privacy</a></td>
                </tr>
                <tr>
                  <td style={tdStyle}>Neon</td>
                  <td style={tdStyle}>Managed PostgreSQL database</td>
                  <td style={tdStyle}><a href="https://neon.tech/privacy-policy" style={{ color: "#2563EB" }} target="_blank" rel="noopener noreferrer">neon.tech/privacy-policy</a></td>
                </tr>
                <tr>
                  <td style={tdStyle}>Upstash</td>
                  <td style={tdStyle}>Redis cache</td>
                  <td style={tdStyle}><a href="https://upstash.com/trust/privacy.pdf" style={{ color: "#2563EB" }} target="_blank" rel="noopener noreferrer">upstash.com/trust/privacy.pdf</a></td>
                </tr>
                <tr>
                  <td style={tdStyle}>Plausible</td>
                  <td style={tdStyle}>Analytics (no personal data)</td>
                  <td style={tdStyle}><a href="https://plausible.io/data-policy" style={{ color: "#2563EB" }} target="_blank" rel="noopener noreferrer">plausible.io/data-policy</a></td>
                </tr>
                <tr>
                  <td style={tdStyle}>Resend</td>
                  <td style={tdStyle}>Admin emails only</td>
                  <td style={tdStyle}><a href="https://resend.com/legal/privacy-policy" style={{ color: "#2563EB" }} target="_blank" rel="noopener noreferrer">resend.com/legal/privacy-policy</a></td>
                </tr>
                <tr>
                  <td style={tdStyle}>Sentry</td>
                  <td style={tdStyle}>Error logs (no personal data)</td>
                  <td style={tdStyle}><a href="https://sentry.io/privacy/" style={{ color: "#2563EB" }} target="_blank" rel="noopener noreferrer">sentry.io/privacy</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 13. Updates to This Policy */}
        <div style={section}>
          <h2 style={h2Style}>13. Updates to This Policy</h2>
          <p style={pStyle}>
            We may update this Privacy Policy from time to time as our data practices or applicable laws change. Material changes will be highlighted at the top of this page with an updated &quot;Last updated&quot; date. Your continued use of the platform after changes take effect constitutes acceptance of the updated policy.
          </p>
        </div>

        {/* 14. Contact */}
        <div style={section}>
          <h2 style={h2Style}>14. Contact</h2>
          <p style={pStyle}>
            Email: <a href="mailto:support@janadhristi.in" style={{ color: "#2563EB" }}>support@janadhristi.in</a>
          </p>
          <p style={pStyle}>
            Platform: <a href="https://janadhristi.in" style={{ color: "#2563EB" }}>janadhristi.in</a>
          </p>
          <p style={pStyle}>
            GitHub: <a href="https://github.com/jayanthmb14/forthepeople" style={{ color: "#2563EB" }} target="_blank" rel="noopener noreferrer">github.com/jayanthmb14/forthepeople</a>
          </p>
          <p style={pStyle}>
            Operator: Jayanth M B, Bengaluru, Karnataka, India
          </p>
        </div>

        {/* Cross-links */}
        <div
          style={{
            borderTop: "1px solid #E8E8E4",
            paddingTop: 16,
            marginTop: 32,
            fontSize: 12,
            color: "#9B9B9B",
          }}
        >
          See also:{" "}
          <Link href="/disclaimer" style={{ color: "#2563EB", textDecoration: "none" }}>
            Disclaimer
          </Link>
          {" · "}
          <Link href="/about" style={{ color: "#2563EB", textDecoration: "none" }}>
            About
          </Link>
        </div>
      </div>
    </div>
  );
}
