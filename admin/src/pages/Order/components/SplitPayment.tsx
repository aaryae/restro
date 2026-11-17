import { CurrencySign } from "@/constants";
import { POS_LIST_LIMIT } from "@/constants/listLimits";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildAssetUrl } from "@/utils/buildAssetUrl";
import { buildQueryString } from "@/utils/generalHelper";
import {
  Banknote,
  Building2,
  Check,
  QrCode,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import styles from "./SplitPayment.module.css";

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
  const [qrAccountId, setQrAccountId] = useState<number | null>(null);

  const url = buildQueryString("account/list", {
    page: 1,
    limit: POS_LIST_LIMIT,
  });
  const { data: allAccount, isSuccess: accountSuccess } = useGetApiQuery({
    url,
  });

  const accounts: any[] = useMemo(() => {
    const rows = accountSuccess ? allAccount?.data?.data ?? [] : [];
    // Match checkout cash/QR: only active primary accounts (isDefault).
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
  const isOver = remaining < -0.01;
  const isSettled =
    dueTotal > 0 && remaining >= -0.01 && remaining <= 0.01;
  const allocatedPercent =
    dueTotal > 0 ? Math.min(100, (totalPaid / dueTotal) * 100) : 0;
  const activeLineCount = useMemo(
    () =>
      Object.values(amounts).filter((v) => (parseFloat(v) || 0) > 0).length,
    [amounts],
  );

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

  const clearAmount = (accountId: string) => {
    setAmounts((prev) => {
      const next = { ...prev };
      delete next[accountId];
      return next;
    });
  };

  const accountIcon = (type: string) => {
    if (type === "cash") return <Banknote size={15} />;
    if (type === "wallet") return <Wallet size={15} />;
    return <Building2 size={15} />;
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

  const statusMessage = (() => {
    if (isSettled) {
      return activeLineCount > 1
        ? `Ready — split across ${activeLineCount} methods`
        : "Ready — amount fully covered";
    }
    if (isOver) {
      return `Over by ${CurrencySign} ${Math.abs(remaining).toFixed(2)} — reduce a line`;
    }
    if (totalPaid <= 0) {
      return "Enter an amount on each method they are using";
    }
    return `${CurrencySign} ${remaining.toFixed(2)} still needed`;
  })();

  return (
    <div className={styles.splitPanel}>
      <div
        className={`${styles.splitStatus} ${
          isSettled
            ? styles.splitStatusOk
            : isOver
              ? styles.splitStatusOver
              : styles.splitStatusOpen
        }`}
      >
        <div className={styles.splitStatusTop}>
          <div className={styles.splitStatusDue}>
            <span className={styles.splitStatusLabel}>Bill total</span>
            <span className={styles.splitStatusTotal}>
              {CurrencySign} {dueTotal.toFixed(2)}
            </span>
          </div>
          <div className={styles.splitStatusRemain}>
            <span className={styles.splitStatusLabel}>
              {isSettled ? "Covered" : isOver ? "Over" : "Left to allocate"}
            </span>
            <span className={styles.splitStatusRemainValue}>
              {isSettled ? (
                <>
                  <Check size={16} strokeWidth={2.5} /> Done
                </>
              ) : (
                <>
                  {CurrencySign} {Math.abs(remaining).toFixed(2)}
                </>
              )}
            </span>
          </div>
        </div>

        <div
          className={styles.splitProgress}
          role="progressbar"
          aria-valuenow={Math.round(allocatedPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Amount allocated"
        >
          <div
            className={`${styles.splitProgressBar} ${
              isOver ? styles.splitProgressBarOver : ""
            }`}
            style={{ width: `${isOver ? 100 : allocatedPercent}%` }}
          />
        </div>

        <p className={styles.splitStatusMsg}>{statusMessage}</p>
      </div>

      <div className={styles.splitList}>
        {!accountSuccess ? (
          <p className={styles.splitEmpty}>Loading accounts…</p>
        ) : accounts.length === 0 ? (
          <p className={styles.splitEmpty}>
            No primary accounts set up. Mark accounts as primary in Cash &amp;
            Banks.
          </p>
        ) : (
          accounts.map((account: any) => {
            const aid = String(account.id);
            const amountValue = parseFloat(amounts[aid] || "0") || 0;
            const hasAmount = amountValue > 0;
            const canFill = remaining > 0.01;

            return (
              <div
                key={account.id}
                className={`${styles.splitRow} ${
                  hasAmount ? styles.splitRowActive : ""
                }`}
              >
                <div className={styles.splitRowMain}>
                  <div className={styles.splitRowInfo}>
                    <span className={styles.splitRowIcon} aria-hidden>
                      {accountIcon(account.accountType)}
                    </span>
                    <div className={styles.splitRowText}>
                      <span className={styles.splitRowName}>{account.name}</span>
                      <span className={styles.splitRowType}>
                        {account.accountType}
                      </span>
                    </div>
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
                        title="Show QR"
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
                        placeholder="0.00"
                        value={amounts[aid] || ""}
                        onChange={(e) => handleAmountChange(aid, e.target.value)}
                        aria-label={`Amount for ${account.name}`}
                      />
                    </div>

                    {hasAmount ? (
                      <button
                        type="button"
                        className={styles.splitClearBtn}
                        onClick={() => clearAmount(aid)}
                        aria-label={`Clear ${account.name}`}
                        title="Clear"
                      >
                        <X size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.splitFillBtn}
                        disabled={!canFill}
                        onClick={() => fillRemaining(aid)}
                        title={
                          canFill
                            ? `Put remaining ${CurrencySign} ${remaining.toFixed(2)} here`
                            : "Nothing left to allocate"
                        }
                      >
                        Fill left
                      </button>
                    )}
                  </div>
                </div>

                {hasAmount && canFill ? (
                  <div className={styles.splitRowFooter}>
                    <button
                      type="button"
                      className={styles.splitFillLink}
                      onClick={() => fillRemaining(aid)}
                    >
                      Add remaining {CurrencySign} {remaining.toFixed(2)}
                    </button>
                  </div>
                ) : null}

                {qrAccountId === account.id && (
                  <div className={styles.splitQrPanel}>
                    {staticQrUrl ? (
                      <img
                        src={buildAssetUrl(staticQrUrl)}
                        alt={`${account.name} QR`}
                        className={styles.splitQrImage}
                      />
                    ) : (
                      <p className={styles.splitEmpty}>
                        No QR configured for this account.
                      </p>
                    )}
                    <p className={styles.splitQrHint}>
                      Customer scans, then enter the paid amount above.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {!isMemberAssigned && !isSettled && dueTotal > 0 && totalPaid > 0 ? (
        <p className={styles.splitHintWarn}>
          Allocate the full bill before completing the sale.
        </p>
      ) : null}
    </div>
  );
}

export default SplitPayment;
