import { getToken } from "./tokenHandler";

export const messageGenerator = (user, userID, senderID, type) => {
  const lang = getToken("lang");
  let senderName;
  let typeRequest;

  switch (type) {
    case "Approval_Request":
      lang === "jp"
        ? (typeRequest = "が承認依頼を送った")
        : (typeRequest = "has sent Approval request to");
      break;
    case "Approved":
      lang === "jp"
        ? (typeRequest = "の要請を承認した")
        : (typeRequest = "has Approved the request of");
      break;
    case "Rejected":
      lang === "jp"
        ? (typeRequest = "の要求を拒否した")
        : (typeRequest = "has Rejected the request of");
      break;
    default:
      lang === "jp"
        ? (typeRequest = "へのリクエストは保留となっている。")
        : (typeRequest = "has PENDING Request to");
      break;
  }

  //   if sender is supervisor
  if (user.supervisor !== null) {
    if (user.supervisor.id === senderID) {
      senderName = user.supervisor.username;
    }
  }

  //   if sender is sub ordinate
  if (user.subordinates.length > 0) {
    console.log(user, "user");
    const sender = user.subordinates.filter((each) => each.id === senderID);
    console.log(sender, "Sender", senderID, "Sender id");
    senderName =
      sender && sender.length > 0 && sender[0].username
        ? sender[0].username
        : "Anonymous";
  }

  return `${senderName} ${typeRequest} ${user.username}`;
};

export default function stringToSlug(str: string) {
  return str
    .toLowerCase() // Convert to lowercase
    .trim() // Remove whitespace from both ends
    .replace(/[\s\W-]+/g, "-") // Replace spaces & non-word characters with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export function findChangedData(data: any, response: any) {
  const changedData = Object.keys(data).reduce((acc, key) => {
    if (data[key] !== response?.data?.[key]) {
      acc[key] = data[key];
    }
    return acc;
  }, {} as any);

  if (Object.keys(changedData).length === 0) {
    console.log("No Changes found");
    return;
  }
  return changedData;
}

export function buildQueryString(
  url: string,
  query: { page: number; limit: number; search?: Object },
) {
  let params = new URLSearchParams();

  query.search &&
    Object.keys(query.search).forEach((each) => {
      if (
        query.search[each] !== "" &&
        query.search[each] !== undefined &&
        query.search[each] !== null
      ) {
        params.append(each, query.search[each]);
      }
    });

  params.append("page", query.page.toString());
  params.append("limit", query.limit.toString());

  return `${url}?${params}`;
}
