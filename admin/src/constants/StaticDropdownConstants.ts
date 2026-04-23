export const SEO_PAGES_OPTIONS = [
  {
    label: "Home Page",
    value: "home-page",
  },
  {
    label: "Menu Page",
    value: "menu-page",
  },
  {
    label: "Blog Page",
    value: "blog-page",
  },
  {
    label: "Loyalty Page",
    value: "loyalty-page",
  },
  {
    label: "Contact Page",
    value: "contact-page",
  },
];

export const EMAIL_TEMPLATE_OPTIONS = [
  {
    label: "Registration OTP",
    value: "registrationOtp",
    desc: "This template is used when a user registers and receives an OTP.",
    email_variables: ["name", "email", "otp"],
  },
  {
    label: "Regenerate OTP",
    value: "regenerateOtp",
    desc: "This template is used when a user requests to regenerate their OTP.",
    email_variables: ["name", "email", "otp"],
  },
  {
    label: "Forget Password OTP",
    value: "generateFPOtp",
    desc: "This template is used when a user forgets their password and requests an OTP.",
    email_variables: ["name", "email", "otp"],
  },
  {
    label: "Request Approval Success",
    value: "requestApprovalSuccess",
    desc: "This template is used when a user's approval request is approved by a supervisor.",
    email_variables: [
      "name",
      "senderUserName",
      "requestId",
      "email",
      "supervisorId",
    ],
  },
  {
    label: "Reject Approval Request",
    value: "Rejected",
    desc: "This template is used when a user's approval request is rejected by a supervisor.",
    email_variables: [
      "name",
      "senderUserName",
      "requestId",
      "email",
      "supervisorId",
    ],
  },
  {
    label: "Request For Approval",
    value: "requestForApproval",
    desc: "This template is used when a user submits a new approval request for changes.",
    email_variables: [
      "name",
      "senderUserName",
      "requestId",
      "email",
      "supervisorId",
    ],
  },
  {
    label: "Contact Enquiry",
    value: "contactEnquiry",
    desc: "This template is used when a user submits a contact enquiry.",
    email_variables: ["name", "email"],
  },
  {
    label: "Payment Success",
    value: "paymentSuccess",
    desc: "This template is used when a user payment is success.",
    email_variables: [
      "name",
      "email",
      "orderStatus",
      "paymentStatus",
      "trackingNo",
    ],
  },
  {
    label: "Payment Failed",
    value: "paymentFailed",
    desc: "This template is used when a user payment is failed.",
    email_variables: [
      "name",
      "email",
      "orderStatus",
      "paymentStatus",
      "trackingNo",
    ],
  },
  {
    label: "Order Shipped",
    value: "orderShipped",
    desc: "This template is used when a user order status is proceed to shipped.",
    email_variables: ["name", "email", "orderStatus", "trackingNo"],
  },
  {
    label: "Order Delivered",
    value: "orderDelivered",
    desc: "This template is used when a user order is delivered.",
    email_variables: ["name", "email", "orderStatus", "trackingNo"],
  },
  {
    label: "Order Cancelled",
    value: "orderCancelled",
    desc: "This template is used when a user order is cancelled.",
    email_variables: ["name", "email", "orderStatus", "trackingNo"],
  },
];

export const ORDER_STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export const PAYMENT_STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Complete", value: "complete" },
  { label: "Failed", value: "failed" },
  { label: "Expired", value: "expired" },
];

export const nepaliMonths = [
  "Baisakh",
  "Jestha",
  "Ashar",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];
