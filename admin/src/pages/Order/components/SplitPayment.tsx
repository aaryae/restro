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
  Minus,
  Plus,
  QrCode,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import styles from "./SplitPayment.module.css";

const MIN_PEOPLE = 2;
const MAX_PEOPLE = 50;

type PayerLine = {
  id: string;
  accountId: string;
  amount: string;
};

interface SplitPaymentProps {
  grandTotal: number;
  setSplitPaymentData: React.Dispatch<any>;
  /** Registered customer already chosen in the Customer section above. */
  memberName?: string | null;
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
  if (type === "cash") return <Banknote size={14} />;
  if (type === "wallet") return <Wallet size={14} />;
  return <Building2 size={14} />;
}

function SplitPayment({
  grandTotal,
  setSplitPaymentData,
  memberName = null,
}: SplitPaymentProps) {
  const lineIdPrefix = useId();
  const [peopleCount, setPeopleCount] = useState(2);
  const [customMode, setCustomMode] = useState(false);
  const [sharedAccountId, setSharedAccountId] = useState("");
  const [lines, setLines] = useState<PayerLine[]>([]);
  const [qrLineId, setQrLineId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!sharedAccountId && defaultAccountId) {
      setSharedAccountId(defaultAccountId);
    }
  }, [defaultAccountId, sharedAccountId]);

  const makeLine = (accountId: string, amount = ""): PayerLine => ({
    id: `${lineIdPrefix}-${Math.random().toString(36).slice(2, 9)}`,
    accountId,
    amount,
  });

  const dueTotal = Number(grandTotal) || 0;
  const perPersonShares = useMemo(
    () => equalShareAmounts(dueTotal, peopleCount),
    [dueTotal, peopleCount],
  );
  const perPersonLabel = perPersonShares[0] ?? "0.00";

  const activeAccountId = customMode
    ? lines[0]?.accountId || sharedAccountId
    : sharedAccountId || defaultAccountId;

  const sharedAccount = accounts.find((a) => String(a.id) === activeAccountId);

  const totalPaid = useMemo(() => {
    if (!customMode) return dueTotal > 0 ? dueTotal : 0;
    return lines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0);
  }, [customMode, lines, dueTotal]);

  const remaining = customMode ? dueTotal - totalPaid : 0;
  const isOver = customMode && remaining < -0.01;
  const isSettled = customMode
    ? dueTotal > 0 && remaining >= -0.01 && remaining <= 0.01
    : dueTotal > 0 && Boolean(sharedAccountId || defaultAccountId);
  const allocatedPercent = customMode
    ? dueTotal > 0
      ? Math.min(100, (totalPaid / dueTotal) * 100)
      : 0
    : isSettled
      ? 100
      : 0;
  const canFill = customMode && remaining > 0.01;

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

  const clampPeople = (value: number) =>
    Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, value));

  const setPeople = (value: number) => {
    const next = clampPeople(value);
    setPeopleCount(next);
    if (customMode && defaultAccountId) {
      const shares = equalShareAmounts(dueTotal, next);
      const account = sharedAccountId || defaultAccountId;
      setLines(shares.map((amount) => makeLine(account, amount)));
      setQrLineId(null);
    }
  };

  const enterCustomMode = () => {
    const account = sharedAccountId || defaultAccountId;
    if (!account) return;
    const shares = equalShareAmounts(dueTotal, peopleCount);
    setLines(shares.map((amount) => makeLine(account, amount)));
    setCustomMode(true);
    setQrLineId(null);
  };

  const exitCustomMode = () => {
    setCustomMode(false);
    setLines([]);
    setQrLineId(null);
  };

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
    const nextLines =
      lines.length <= 1
        ? lines.map((line) =>
            line.id === id ? { ...line, amount: "" } : line,
          )
        : lines.filter((line) => line.id !== id);
    setLines(nextLines);
    if (lines.length > 1) {
      setPeopleCount(clampPeople(nextLines.length));
    }
    setQrLineId((prev) => (prev === id ? null : prev));
  };

  const addPerson = () => {
    const account = sharedAccountId || defaultAccountId;
    if (!account || lines.length >= MAX_PEOPLE) return;
    setLines((prev) => [...prev, makeLine(account)]);
    setPeopleCount((prev) => clampPeople(prev + 1));
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

    const push = (accountIdRaw: string, amountRaw: number) => {
      const amount = roundMoney(amountRaw);
      const accountId = Number(accountIdRaw);
      if (amount <= 0 || !Number.isFinite(accountId) || accountId <= 0) return;
      const account = accounts.find((a) => String(a.id) === String(accountId));
      const paymentMethod = paymentMethodForType(account?.accountType);
      const existing = merged.get(accountId);
      if (existing) {
        existing.amount = roundMoney(existing.amount + amount);
      } else {
        merged.set(accountId, { paymentMethod, amount, accountId });
      }
    };

    if (!customMode) {
      push(sharedAccountId || defaultAccountId, dueTotal);
    } else {
      for (const line of lines) {
        push(line.accountId, parseFloat(line.amount) || 0);
      }
    }

    const payments = [...merged.values()];
    setSplitPaymentData(payments.length > 0 ? payments : null);
  }, [
    customMode,
    lines,
    sharedAccountId,
    defaultAccountId,
    isSettled,
    dueTotal,
    setSplitPaymentData,
    accounts,
  ]);

  const statusMessage = (() => {
    if (!customMode && isSettled) {
      return `Ready — ${peopleCount} people · ${CurrencySign} ${perPersonLabel} each`;
    }
    if (isSettled) {
      return `Ready — split across ${lines.filter((l) => (parseFloat(l.amount) || 0) > 0).length} payments`;
    }
    if (isOver) {
      return `Over by ${CurrencySign} ${Math.abs(remaining).toFixed(2)}`;
    }
    if (customMode && totalPaid <= 0) {
      return "Enter each payment amount";
    }
    if (customMode) {
      return `${CurrencySign} ${remaining.toFixed(2)} still needed`;
    }
    return "Set people count and payment method";
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
                  {CurrencySign}{" "}
                  {Math.abs(customMode ? remaining : dueTotal).toFixed(2)}
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

      <div className={styles.splitPeople}>
        <span className={styles.splitPeopleLabel}>
          <Users size={14} /> People splitting
        </span>
        <div className={styles.splitPeopleControls}>
          <button
            type="button"
            className={styles.splitStepBtn}
            disabled={peopleCount <= MIN_PEOPLE}
            onClick={() => setPeople(peopleCount - 1)}
            aria-label="Fewer people"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            className={styles.splitPeopleInput}
            min={MIN_PEOPLE}
            max={MAX_PEOPLE}
            value={peopleCount}
            onChange={(e) => {
              const raw = parseInt(e.target.value, 10);
              if (Number.isNaN(raw)) return;
              setPeople(raw);
            }}
            aria-label="Number of people"
          />
          <button
            type="button"
            className={styles.splitStepBtn}
            disabled={peopleCount >= MAX_PEOPLE}
            onClick={() => setPeople(peopleCount + 1)}
            aria-label="More people"
          >
            <Plus size={14} />
          </button>
          <span className={styles.splitEach}>
            {CurrencySign} {perPersonLabel} each
          </span>
        </div>
      </div>

      {!accountSuccess ? (
        <p className={styles.splitEmpty}>Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <p className={styles.splitEmpty}>
          No primary accounts set up. Mark accounts as primary in Cash &amp;
          Banks.
        </p>
      ) : !customMode ? (
        <div className={styles.splitSimple}>
          <label className={styles.splitFieldLabel}>
            Everyone pays with
            <span className={styles.splitSelectWrap}>
              <span className={styles.splitSelectIcon} aria-hidden>
                {accountIcon(sharedAccount?.accountType || "cash")}
              </span>
              <select
                className={styles.splitSelect}
                value={sharedAccountId || defaultAccountId}
                onChange={(e) => setSharedAccountId(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.name}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <p className={styles.splitSimpleHint}>
            {peopleCount} equal shares · collected as one{" "}
            {sharedAccount?.accountType || "cash"} payment
          </p>

          <button
            type="button"
            className={styles.splitCustomizeBtn}
            onClick={enterCustomMode}
          >
            Different amounts or methods
          </button>
        </div>
      ) : (
        <>
          <div className={styles.splitCustomHeader}>
            <span className={styles.splitPeopleLabel}>Individual payments</span>
            <button
              type="button"
              className={styles.splitLinkBtn}
              onClick={exitCustomMode}
            >
              Back to equal split
            </button>
          </div>

          <div className={styles.splitList}>
            {lines.map((line, index) => {
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
                    <span className={styles.splitPersonBadge}>{index + 1}</span>

                    <span className={styles.splitSelectWrap}>
                      <span className={styles.splitSelectIcon} aria-hidden>
                        {accountIcon(account?.accountType || "cash")}
                      </span>
                      <select
                        className={styles.splitSelect}
                        value={line.accountId}
                        onChange={(e) =>
                          updateLine(line.id, { accountId: e.target.value })
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

                    <span className={styles.splitAmountWrap}>
                      <span className={styles.splitCurrency}>{CurrencySign}</span>
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

                    {showQr ? (
                      <button
                        type="button"
                        className={`${styles.splitIconBtn} ${
                          qrLineId === line.id ? styles.splitIconBtnOn : ""
                        }`}
                        onClick={() =>
                          setQrLineId((prev) =>
                            prev === line.id ? null : line.id,
                          )
                        }
                        aria-label={`Show QR for person ${index + 1}`}
                        title="Show QR"
                      >
                        <QrCode size={14} />
                      </button>
                    ) : null}

                    {canFill ? (
                      <button
                        type="button"
                        className={styles.splitFillBtn}
                        onClick={() => fillRemaining(line.id)}
                        title={`Put remaining ${CurrencySign} ${remaining.toFixed(2)} here`}
                      >
                        Left
                      </button>
                    ) : null}

                    <button
                      type="button"
                      className={styles.splitIconBtn}
                      onClick={() => removeLine(line.id)}
                      aria-label={`Remove person ${index + 1}`}
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
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
                        Person {index + 1} scans, then confirm the amount.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {lines.length < MAX_PEOPLE ? (
            <button
              type="button"
              className={styles.splitAddBtn}
              onClick={addPerson}
            >
              <Plus size={15} />
              Add person
            </button>
          ) : null}
        </>
      )}

      <p className={styles.splitMemberHint}>
        {memberName
          ? `Registered customer for this bill: ${memberName} (set above). Loyalty applies to them for the whole bill.`
          : "If one payer is a registered customer, assign them in Customer above — loyalty is for one customer per bill."}
      </p>
    </div>
  );
}

export default SplitPayment;
