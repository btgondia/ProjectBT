import React from "react";

const TermsAndConditions = () => {
  const sectionStyle = {
    marginBottom: "20px",
  };

  const headingStyle = {
    borderBottom: "1px solid #ccc",
    paddingBottom: "5px",
    marginBottom: "10px",
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "auto",
        padding: "20px",
        height: "100vh",
        overflow: "scroll",
      }}
    >
      <h1>Terms and Conditions</h1>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>1. Acceptance of Terms</h2>
        <p>
          By downloading, installing, or using the Business Call Manager mobile
          application ("the App"), you agree to be bound by these Terms and
          Conditions, as well as our Privacy Policy. If you do not agree with
          any part of these terms, you may not use the App.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>2. License</h2>
        <p>
          We grant you a limited, non-exclusive, non-transferable, revocable
          license to use the App for your personal or business purposes. You may
          not modify, reproduce, distribute, sell, or exploit the App or any of
          its contents without our prior written consent.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>3. User Responsibilities</h2>
        <p>
          You are solely responsible for your use of the App, including any
          content or information you provide through the App. You agree not to
          engage in any unlawful or unauthorized activity while using the App,
          and to comply with all applicable laws and regulations.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>4. Intellectual Property</h2>
        <p>
          All intellectual property rights in the App and its contents belong to
          us or our licensors. You may not use our trademarks, logos, or other
          proprietary information without our prior written consent.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>5. Limitation of Liability</h2>
        <p>
          We make no warranties or representations about the accuracy or
          completeness of the information provided by the App. In no event shall
          we be liable for any direct, indirect, incidental, special, or
          consequential damages arising out of or in connection with your use of
          the App.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>6. Indemnification</h2>
        <p>
          You agree to indemnify and hold us harmless from any claims, losses,
          liabilities, damages, costs, and expenses (including attorney's fees)
          arising out of or related to your use of the App or any violation of
          these Terms and Conditions.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>7. Third-Party Services</h2>
        <p>
          The App may contain links to third-party websites or services that are
          not owned or controlled by us. We are not responsible for the content,
          privacy policies, or practices of any third-party websites or
          services.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>8. Modification and Termination</h2>
        <p>
          We reserve the right to modify or discontinue the App (or any part
          thereof) at any time without notice. We also reserve the right to
          terminate your access to the App for any reason, without prior notice
          or liability.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>9. Governing Law</h2>
        <p>
          These Terms and Conditions shall be governed by and construed in
          accordance with the laws of [Your Country], without regard to its
          conflict of law provisions.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>10. Contact Us</h2>
        <p>
          If you have any questions or concerns about these Terms and
          Conditions, please contact us.
        </p>
      </div>
      <div style={sectionStyle}>
        <p>
          By using the Business Call Manager app, you agree to abide by these
          terms and conditions.
        </p>
      </div>
    </div>
  );
};

export default TermsAndConditions;
