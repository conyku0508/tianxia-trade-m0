export const categories: Record<string, string> = {
  food: "糧食",
  agriculture: "農產",
  textile: "織物",
  craft: "工藝",
  metal: "金屬",
  luxury: "珍貨",
};
export const symbols: Record<string, string> = {
  food: "穀",
  agriculture: "葉",
  textile: "絹",
  craft: "瓷",
  metal: "銀",
  luxury: "珍",
};
export const money = (n: number | null) =>
  n === null
    ? "資料不足"
    : n.toLocaleString("zh-TW", { maximumFractionDigits: 2 });
export const percent = (n: number) => `${Math.round(n * 100)}%`;
