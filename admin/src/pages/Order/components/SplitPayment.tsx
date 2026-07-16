import { CurrencySign } from "@/constants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildAssetUrl } from "@/utils/buildAssetUrl";
import { buildQueryString } from "@/utils/generalHelper";
import { Banknote, Building2, QrCode, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import styles from "./SplitPayment.module.css";

type AccountFilter = "all" | "cash" | "bank" | "wallet";

interface SplitPaymentProps {
  grandTotal: number;
  setSplitPaymentData: React.Dispatch<any>;
  isMemberAssigned?: boolean;
}

function SplitPayment({
  grandTotal,
  setSplitPaymentData,
  isMemberAssigned = false,
}: SplitPaymentProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<AccountFilter>("all");
  const [qrAccountId, setQrAccountId] = useState<number | null>(null);

  const url = buildQueryString("account/list", { page: 1, limit: 99999 });
  const { data: allAccount, isSuccess: accountSuccess } = useGetApiQuery({
    url,
  });

  const accounts: any[] = useMemo(() => {
    const rows = accountSuccess ? allAccount?.data?.data ?? [] : [];
    // Match checkout cash/QR: only active primary accounts (isDefault).
    // For banks this surfaces the primary bank only.
    return rows.filter(
      (a: any) => a?.status === "active" && Boolean(a?.isDefault),
    );
  }, [accountSuccess, allAccount]);

  const { data: qrAccountDetail } = useGetApiQuery(
    qrAccountId ? { url: `account/${qrAccountId}` } : ({} as any),
    { skip: !qrAccountId },
  );

  const staticQrUrl =
    (qrAccountDetail?.data as any)?.mediaArr?.[0]?.imageUrl ||
    (qrAccountDetail?.data as any)?.bankAccount?.staticQrUrl ||
    (qrAccountDetail?.data as any)?.walletAccount?.staticQrUrl ||
    null;

  const filteredAccounts = useMemo(() => {
    if (filter === "all") return accounts;
    return accounts.filter((a) => a.accountType === filter);
  }, [accounts, filter]);

  const totalPaid = useMemo(
    () =>
      Object.values(amounts).reduce(
        (sum, amount) => sum + (parseFloat(amount) || 0),
        0,
      ),
    [amounts],
  );

  const dueTotal = Number(grandTotal) || 0;
  const remaining = dueTotal - totalPaid;
  const isSettled =
    dueTotal > 0 && remaining >= -0.01 && remaining <= 0.01;
  const allocatedPercent =
    dueTotal > 0 ? Math.min(100, (totalPaid / dueTotal) * 100) : 0;

  const findPaymentType = (
    accountId: string,
  ): "cash" | "card" | "online" => {
    const type = accounts.find((a) => String(a.id) === accountId)?.accountType;
    if (type === "cash") return "cash";
    if (type === "bank") return "card";
    return "online";
  };

  const handleAmountChange = (accountId: string, value: string) => {
    if (value !== "" && Number.isNaN(Number(value))) return;
    setAmounts((prev) => ({ ...prev, [accountId]: value }));
  };

  const fillRemaining = (accountId: string) => {
    if (remaining <= 0.01) return;
    const current = parseFloat(amounts[accountId] || "0") || 0;
    setAmounts((prev) => ({
      ...prev,
      [accountId]: (current + remaining).toFixed(2),
    }));
  };

  const accountIcon = (type: string) => {
    if (type === "cash") return <Banknote size={14} />;
    if (type === "wallet") return <Wallet size={14} />;
    return <Building2 size={14} />;
  };

  useEffect(() => {
    if (!isSettled || dueTotal <= 0) {
      setSplitPaymentData(null);
      return;
    }

    const payments = Object.entries(amounts)
      .map(([accountId, amount]) => ({
        paymentMethod: findPaymentType(accountId),
        amount: Math.round((parseFloat(amount) || 0) * 100) / 100,
        accountId: Number(accountId),
      }))
      .filter((p) => p.amount > 0);

    setSplitPaymentData(payments.length > 0 ? payments : null);
  }, [amounts, isSettled, dueTotal, setSplitPaymentData, accounts]);

  const filters: { id: AccountFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "cash", label: "Cash" },
    { id: "bank", label: "Bank" },
    { id: "wallet", label: "Wallet" },
  ];

  return (
    <div className={styles.splitPanel}>
      <div className={styles.splitHero}>
        <div className={styles.splitHeroBlock}>
          <span className={styles.splitHeroLabel}>To split</span>
          <span className={styles.splitHeroValue}>
            {CurrencySign} {dueTotal.toFixed(2)}
          </span>
        </div>
        <div className={styles.splitHeroBlock}>
          <span className={styles.splitHeroLabel}>
            {isSettled ? "Ready" : "Left"}
          </span>
          <span
            className={`${styles.splitHeroValue} ${
              isSettled ? styles.splitHeroLeftOk : styles.splitHeroLeft
            }`}
          >
            {CurrencySign} {Math.abs(remaining).toFixed(2)}
          </span>
        </div>
      </div>

      <div className={styles.splitProgress}>
        <div
          className={styles.splitProgressBar}
          style={{ width: `${allocatedPercent}%` }}
        />
      </div>

      <div className={styles.splitFilters}>
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`${styles.splitFilterBtn} ${
              filter === f.id ? styles.splitFilterBtnOn : ""
            }`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.splitList}>
        {!accountSuccess ? (
          <p className={styles.splitEmpty}>Loading accounts…</p>
        ) : filteredAccounts.length === 0 ? (
          <p className={styles.splitEmpty}>
            No primary accounts in this group. Mark accounts as primary in Cash
            &amp; Banks.
          </p>
        ) : (
          filteredAccounts.map((account: any) => {
            const aid = String(account.id);
            const hasAmount = (parseFloat(amounts[aid] || "0") || 0) > 0;
            return (
              <div
                key={account.id}
                className={`${styles.splitRow} ${
                  hasAmount ? styles.splitRowActive : ""
                }`}
              >
                <div className={styles.splitRowMain}>
                  <div className={styles.splitRowInfo}>
                    <span className={styles.splitRowName}>{account.name}</span>
                    <span className={styles.splitRowType}>
                      {accountIcon(account.accountType)} {account.accountType}
                    </span>
                  </div>
                  <div className={styles.splitRowActions}>
                    {account.accountType !== "cash" && (
                      <button
                        type="button"
                        className={`${styles.splitQrBtn} ${
                          qrAccountId === account.id ? styles.splitQrBtnOn : ""
                        }`}
                        onClick={() =>
                          setQrAccountId((prev) =>
                            prev === account.id ? null : account.id,
                          )
                        }
                        aria-label={`Show QR for ${account.name}`}
                      >
                        <QrCode size={15} />
                      </button>
                    )}
                    <div className={styles.splitAmountWrap}>
                      <span className={styles.splitCurrency}>{CurrencySign}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={styles.splitAmountInput}
                        placeholder="0"
                        value={amounts[aid] || ""}
                        onChange={(e) => handleAmountChange(aid, e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.splitRestBtn}
                      disabled={remaining <= 0.01}
                      onClick={() => fillRemaining(aid)}
                    >
                      Rest
                    </button>
                  </div>
                </div>

                {qrAccountId === account.id && (
                  <div className={styles.splitQrPanel}>
                    {staticQrUrl ? (
                      <img
                        src={buildAssetUrl(staticQrUrl)}
                        alt={`${account.name} QR`}
                        className={styles.splitQrImage}
                      />
                    ) : (
                      <p className={styles.splitHintWarn}>
                        No QR configured for this account.
                      </p>
                    )}
                    <p className={styles.splitHint}>
                      Customer scans, then enter the amount above.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isSettled ? (
        <p className={styles.splitReady}>Split matches total — tap Complete below.</p>
      ) : (
        <p className={styles.splitHint}>
          Enter amounts across accounts. Use <strong>Rest</strong> to fill what is
          left on a line.
        </p>
      )}

      {!isMemberAssigned && !isSettled && dueTotal > 0 ? (
        <p className={styles.splitHintWarn}>
          Full amount must be allocated before completing the sale.
        </p>
      ) : null}
    </div>
  );
}

export default SplitPayment;
