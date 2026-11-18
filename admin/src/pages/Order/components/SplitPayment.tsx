import { CurrencySign } from "@/constants";
import { POS_LIST_LIMIT } from "@/constants/listLimits";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildAssetUrl } from "@/utils/buildAssetUrl";
import { roundMoney } from "@/utils/checkoutPayload";
import { buildQueryString } from "@/utils/generalHelper";
import {
  Banknote,
  Building2,
  Check,
  Plus,
  QrCode,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import styles from "./SplitPayment.module.css";

type PayerLine = {
  id: string;
  accountId: string;
  amount: string;
};

interface SplitPaymentProps {
  grandTotal: number;
  setSplitPaymentData: React.Dispatch<any>;
}

function equalShareAmounts(total: number, people: number): string[] {
  if (people <= 0) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / people);
  const remainder = cents - base * people;
  return Array.from({ length: people }, (_, index) => {
    const share = (base + (index < remainder ? 1 : 0)) / 100;
    return share.toFixed(2);
  });
}

function paymentMethodForType(
  accountType: string | undefined,
): "cash" | "card" | "online" {
  if (accountType === "cash") return "cash";
  if (accountType === "bank") return "card";
  return "online";
}

function accountIcon(type: string) {
  if (type === "cash") return <Banknote size={15} />;
  if (type === "wallet") return <Wallet size={15} />;
  return <Building2 size={15} />;
}

function SplitPayment({
  grandTotal,
  setSplitPaymentData,
}: SplitPaymentProps) {
  const lineIdPrefix = useId();
  const [lines, setLines] = useState<PayerLine[]>([]);
  const [qrLineId, setQrLineId] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  const url = buildQueryString("account/list", {
    page: 1,
    limit: POS_LIST_LIMIT,
  });
  const { data: allAccount, isSuccess: accountSuccess } = useGetApiQuery({
    url,
  });

  const accounts: any[] = useMemo(() => {
    const rows = accountSuccess ? allAccount?.data?.data ?? [] : [];
    return rows.filter(
      (a: any) => a?.status === "active" && Boolean(a?.isDefault),
    );
  }, [accountSuccess, allAccount]);

  const defaultAccountId = useMemo(() => {
    const cash = accounts.find((a) => a.accountType === "cash");
    return String((cash ?? accounts[0])?.id ?? "");
  }, [accounts]);

  const makeLine = (accountId: string, amount = ""): PayerLine => ({
    id: `${lineIdPrefix}-${Math.random().toString(36).slice(2, 9)}`,
    accountId,
    amount,
  });

  useEffect(() => {
    if (seeded || !defaultAccountId) return;
    setLines([makeLine(defaultAccountId)]);
    setSeeded(true);
  }, [defaultAccountId, seeded, lineIdPrefix]);

  const qrAccountId = useMemo(() => {
    if (!qrLineId) return null;
    const line = lines.find((l) => l.id === qrLineId);
    return line?.accountId ? Number(line.accountId) : null;
  }, [qrLineId, lines]);

  const { data: qrAccountDetail } = useGetApiQuery(
    qrAccountId ? { url: `account/${qrAccountId}` } : ({} as any),
    { skip: !qrAccountId },
  );

  const staticQrUrl =
    (qrAccountDetail?.data as any)?.mediaArr?.[0]?.imageUrl ||
    (qrAccountDetail?.data as any)?.bankAccount?.staticQrUrl ||
    (qrAccountDetail?.data as any)?.walletAccount?.staticQrUrl ||
    null;

  const dueTotal = Number(grandTotal) || 0;
  const totalPaid = useMemo(
    () =>
      lines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0),
    [lines],
  );
  const remaining = dueTotal - totalPaid;
  const isOver = remaining < -0.01;
  const isSettled = dueTotal > 0 && remaining >= -0.01 && remaining <= 0.01;
  const allocatedPercent =
    dueTotal > 0 ? Math.min(100, (totalPaid / dueTotal) * 100) : 0;
  const activePeople = lines.filter(
    (line) => (parseFloat(line.amount) || 0) > 0,
  ).length;
  const canFill = remaining > 0.01;

  const updateLine = (id: string, patch: Partial<PayerLine>) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  };

  const handleAmountChange = (id: string, value: string) => {
    if (value !== "" && Number.isNaN(Number(value))) return;
    updateLine(id, { amount: value });
  };

  const fillRemaining = (id: string) => {
    if (!canFill) return;
    const line = lines.find((l) => l.id === id);
    if (!line) return;
    const current = parseFloat(line.amount || "0") || 0;
    updateLine(id, { amount: (current + remaining).toFixed(2) });
  };

  const removeLine = (id: string) => {
    setLines((prev) => {
      if (prev.length <= 1) {
        return prev.map((line) =>
          line.id === id ? { ...line, amount: "" } : line,
        );
      }
      return prev.filter((line) => line.id !== id);
    });
    setQrLineId((prev) => (prev === id ? null : prev));
  };

  const addPerson = () => {
    if (!defaultAccountId) return;
    setLines((prev) => [...prev, makeLine(defaultAccountId)]);
  };

  const splitEqually = (people: number) => {
    if (!defaultAccountId || people < 2) return;
    const shares = equalShareAmounts(dueTotal, people);
    setLines(shares.map((amount) => makeLine(defaultAccountId, amount)));
    setQrLineId(null);
  };

  useEffect(() => {
    if (!isSettled || dueTotal <= 0) {
      setSplitPaymentData(null);
      return;
    }

    const merged = new Map<
      number,
      {
        paymentMethod: "cash" | "card" | "online";
        amount: number;
        accountId: number;
      }
    >();

    for (const line of lines) {
      const amount = roundMoney(parseFloat(line.amount) || 0);
      const accountId = Number(line.accountId);
      if (amount <= 0 || !Number.isFinite(accountId) || accountId <= 0) continue;
      const account = accounts.find((a) => String(a.id) === line.accountId);
      const paymentMethod = paymentMethodForType(account?.accountType);
      const existing = merged.get(accountId);
      if (existing) {
        existing.amount = roundMoney(existing.amount + amount);
      } else {
        merged.set(accountId, { paymentMethod, amount, accountId });
      }
    }

    const payments = [...merged.values()];
    setSplitPaymentData(payments.length > 0 ? payments : null);
  }, [lines, isSettled, dueTotal, setSplitPaymentData, accounts]);

  const statusMessage = (() => {
    if (isSettled) {
      return activePeople > 1
        ? `Ready — ${activePeople} people covered the bill`
        : "Ready — amount fully covered";
    }
    if (isOver) {
      return `Over by ${CurrencySign} ${Math.abs(remaining).toFixed(2)} — reduce a person`;
    }
    if (totalPaid <= 0) {
      return "Add each person and how they are paying";
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
              {isSettled ? "Covered" : isOver ? "Over" : "Left"}
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

      <div className={styles.splitEqual}>
        <span className={styles.splitEqualLabel}>
          <Users size={14} /> Split equally
        </span>
        <div className={styles.splitEqualBtns}>
          {[2, 3, 4].map((count) => (
            <button
              key={count}
              type="button"
              className={`${styles.splitEqualBtn} ${
                lines.length === count && isSettled ? styles.splitEqualBtnOn : ""
              }`}
              disabled={!defaultAccountId || dueTotal <= 0}
              onClick={() => splitEqually(count)}
            >
              {count} people
            </button>
          ))}
        </div>
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
          lines.map((line, index) => {
            const account = accounts.find(
              (a) => String(a.id) === line.accountId,
            );
            const hasAmount = (parseFloat(line.amount || "0") || 0) > 0;
            const showQr = account && account.accountType !== "cash";

            return (
              <div
                key={line.id}
                className={`${styles.splitRow} ${
                  hasAmount ? styles.splitRowActive : ""
                }`}
              >
                <div className={styles.splitRowMain}>
                  <div className={styles.splitPerson}>
                    <span className={styles.splitPersonBadge}>
                      {index + 1}
                    </span>
                    <div className={styles.splitPersonFields}>
                      <label className={styles.splitFieldLabel}>
                        Pays with
                        <span className={styles.splitSelectWrap}>
                          <span className={styles.splitSelectIcon} aria-hidden>
                            {accountIcon(account?.accountType || "cash")}
                          </span>
                          <select
                            className={styles.splitSelect}
                            value={line.accountId}
                            onChange={(e) =>
                              updateLine(line.id, {
                                accountId: e.target.value,
                              })
                            }
                            aria-label={`Payment method for person ${index + 1}`}
                          >
                            {accounts.map((a) => (
                              <option key={a.id} value={String(a.id)}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        </span>
                      </label>

                      <label className={styles.splitFieldLabel}>
                        Amount
                        <span className={styles.splitAmountWrap}>
                          <span className={styles.splitCurrency}>
                            {CurrencySign}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={styles.splitAmountInput}
                            placeholder="0.00"
                            value={line.amount}
                            onChange={(e) =>
                              handleAmountChange(line.id, e.target.value)
                            }
                            aria-label={`Amount for person ${index + 1}`}
                          />
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.splitRowActions}>
                    {showQr ? (
                      <button
                        type="button"
                        className={`${styles.splitQrBtn} ${
                          qrLineId === line.id ? styles.splitQrBtnOn : ""
                        }`}
                        onClick={() =>
                          setQrLineId((prev) =>
                            prev === line.id ? null : line.id,
                          )
                        }
                        aria-label={`Show QR for person ${index + 1}`}
                        title="Show QR"
                      >
                        <QrCode size={15} />
                      </button>
                    ) : null}

                    {canFill ? (
                      <button
                        type="button"
                        className={styles.splitFillBtn}
                        onClick={() => fillRemaining(line.id)}
                        title={`Put remaining ${CurrencySign} ${remaining.toFixed(2)} here`}
                      >
                        Fill left
                      </button>
                    ) : null}

                    <button
                      type="button"
                      className={styles.splitClearBtn}
                      onClick={() => removeLine(line.id)}
                      aria-label={
                        lines.length <= 1
                          ? `Clear person ${index + 1}`
                          : `Remove person ${index + 1}`
                      }
                      title={lines.length <= 1 ? "Clear" : "Remove"}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {qrLineId === line.id && (
                  <div className={styles.splitQrPanel}>
                    {staticQrUrl ? (
                      <img
                        src={buildAssetUrl(staticQrUrl)}
                        alt={`${account?.name || "Account"} QR`}
                        className={styles.splitQrImage}
                      />
                    ) : (
                      <p className={styles.splitEmpty}>
                        No QR configured for this account.
                      </p>
                    )}
                    <p className={styles.splitQrHint}>
                      Person {index + 1} scans, then confirm the amount above.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {accounts.length > 0 ? (
        <button
          type="button"
          className={styles.splitAddBtn}
          onClick={addPerson}
        >
          <Plus size={15} />
          Add person
        </button>
      ) : null}
    </div>
  );
}

export default SplitPayment;
