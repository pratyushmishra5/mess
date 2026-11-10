import { useEffect, useState } from "react";
import QRCode from "qrcode";

/* ------------------------------------------------------------------
   API Call Helper
------------------------------------------------------------------ */
const api = async (path, options = {}) => {
  const token = localStorage.getItem("plate-token");
  const response = await fetch(`/api${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Operation failed");
  return data;
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const mealTypes = ["breakfast", "lunch", "snacks", "dinner"];
const mealIcon = { breakfast: "⚡", lunch: "🍱", snacks: "☕", dinner: "🌙" };
const currentDay = (new Date().getDay() + 6) % 7;

/* ------------------------------------------------------------------
   UI Primitives
------------------------------------------------------------------ */
const Icon = ({ children, className = "" }) => (
  <span
    className={`inline-flex h-5 w-5 items-center justify-center font-mono ${className}`}
    aria-hidden="true"
  >
    {children}
  </span>
);

const Card = ({ children, className = "", strong = false }) => (
  <div
    className={`${strong ? "glass-strong" : "glass"} p-5 sm:p-6 ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => (
  <button className={`btn btn-${variant} ${className}`} {...props}>
    {children}
  </button>
);

const Spinner = () => (
  <span
    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-[-.15em]"
    aria-label="Loading"
  />
);

const Input = ({ className = "", ...props }) => (
  <input className={`field ${className}`} {...props} />
);

const Select = ({ options, ...props }) => (
  <select className="field" {...props}>
    {options.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
);

const Status = ({ value }) => (
  <span
    className={`chip ${
      value === "paid" || value === "resolved"
        ? "chip-ok"
        : value === "in-progress"
          ? "chip-warn"
          : "chip-soft"
    }`}
  >
    {value}
  </span>
);

const VegLed = ({ veg }) => (
  <span className="flex items-center gap-1.5 text-xs font-mono font-semibold">
    <span
      className="led"
      style={{ "--c": veg ? "var(--neon)" : "var(--danger)" }}
    />
    <span className="text-muted">{veg ? "VEG" : "NON-VEG"}</span>
  </span>
);

const Heading = ({ title, sub, children }) => (
  <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end">
    <div>
      <div className="kicker mb-1">// SYSTEM PANEL</div>
      <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
    {children}
  </div>
);

const LogoMark = ({ size = 36 }) => (
  <div
    style={{ width: size, height: size }}
    className="grid place-items-center rounded-lg border border-[var(--cyan)] bg-[rgba(0,240,255,0.1)] text-lg font-mono font-black text-[var(--cyan)] shadow-[0_0_12px_rgba(0,240,255,0.3)]"
  >
    HB
  </div>
);

const Logo = ({ size = "md" }) => (
  <div className="flex items-center gap-3">
    <LogoMark size={size === "lg" ? 44 : 36} />
    <span
      className={`font-mono font-bold tracking-wider ${size === "lg" ? "text-2xl" : "text-xl"}`}
    >
      HOSTEL<span className="text-[var(--cyan)]">BITE</span>
      <span className="ml-1 text-[10px] text-muted">v2.4</span>
    </span>
  </div>
);

const ThemeSwitch = ({ dark, onClick }) => (
  <button
    role="switch"
    aria-checked={dark}
    aria-label="Toggle display node"
    className="switch"
    onClick={onClick}
  >
    <span className="switch-knob">{dark ? "🌙" : "☀️"}</span>
  </button>
);

const Modal = ({ children }) => (
  <div className="scrim fixed inset-0 z-50 grid place-items-center p-4">
    <div className="pop w-full max-w-md">{children}</div>
  </div>
);

/* ------------------------------------------------------------------
   Dialogs & Modals
------------------------------------------------------------------ */
function QrDialog({
  title,
  amount,
  data,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  onClose,
  busy,
}) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(data, {
      width: 220,
      margin: 1,
      color: { dark: "#00f0ff", light: "#111827" },
    }).then(setSrc);
  }, [data]);

  return (
    <Modal>
      <div className="ticket-wrap">
        <div className="ticket">
          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kicker">// DIGITAL ACCESS PASS</p>
                <h3 className="mt-1 text-xl font-bold leading-tight">
                  {title}
                </h3>
              </div>
              <span className="stamp">VERIFIED</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-[var(--line)] pt-3">
              <span className="text-xs font-mono text-muted">TOTAL FEE</span>
              <p className="font-mono text-3xl font-extrabold text-[var(--cyan)]">
                ₹{amount}
              </p>
            </div>
          </div>
          <div className="ticket-perf mx-4" />
          <div className="p-6 text-center">
            {src ? (
              <div className="inline-block rounded-xl border border-[var(--cyan)] p-2 bg-[var(--hi)] shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <img
                  className="mx-auto rounded-lg"
                  src={src}
                  alt="Payment QR code"
                />
              </div>
            ) : (
              <div className="skeleton mx-auto h-[200px] w-[200px] rounded-xl" />
            )}
            <p className="mt-3 text-xs font-mono text-muted">
              Scan token at mess verification terminal.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button variant="soft" onClick={onClose}>
                Dismiss
              </Button>
              {secondaryLabel && (
                <Button
                  variant="soft"
                  disabled={busy || !src}
                  onClick={onSecondary}
                >
                  {secondaryLabel}
                </Button>
              )}
              <Button disabled={busy || !src} onClick={onAction}>
                {busy && <Spinner />}
                {busy ? "Processing…" : actionLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CouponDialog({ meal, onRate, onClose }) {
  const [coupon, setCoupon] = useState(null);
  const [couponLoaded, setCouponLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const item = meal.items.join(", ");
  const price = meal.price || 80;

  useEffect(() => {
    let active = true;
    api("/coupons")
      .then((coupons) => {
        if (!active) return;
        setCoupon(
          coupons.find(
            (entry) =>
              entry.day === meal.day &&
              entry.type === meal.type &&
              entry.item === item,
          ) || null,
        );
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setCouponLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [item, meal.day, meal.type]);

  const save = async (payNow) => {
    setBusy(true);
    try {
      const saved = await api("/coupons", {
        method: "POST",
        body: { meal: meal._id, day: meal.day, type: meal.type, item, price },
      });
      if (payNow && saved.status !== "paid") {
        await api(`/coupons/${saved._id}/pay`, { method: "PATCH" });
        setCoupon({
          ...saved,
          status: "paid",
          paidOn: new Date().toISOString(),
        });
      } else {
        setCoupon(saved);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!couponLoaded) {
    return (
      <Modal>
        <Card strong className="text-center">
          <Spinner />
          <p className="mt-3 text-sm font-mono">Syncing token record...</p>
        </Card>
      </Modal>
    );
  }

  if (loadError) {
    return (
      <Modal>
        <Card strong className="text-center">
          <p className="text-sm font-bold text-[var(--danger)]">
            Data Sync Error
          </p>
          <p className="mt-2 text-sm text-muted">{loadError}</p>
          <Button className="mt-4" onClick={onClose}>
            Close
          </Button>
        </Card>
      </Modal>
    );
  }

  if (coupon) {
    return (
      <Modal>
        <Card strong>
          <div className="kicker">// ACTIVE TOKEN</div>
          <h3 className="mt-1 text-xl font-bold">{item}</h3>
          <p className="mt-2 text-sm text-muted">
            Token already registered to your account ledger.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="soft" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => onRate(meal)}>Rate Meal</Button>
          </div>
        </Card>
      </Modal>
    );
  }

  return (
    <QrDialog
      title={`${days[meal.day]} ${meal.type.toUpperCase()} TOKEN`}
      amount={price}
      data={`Daily_Thali-coupon:${meal.day}:${meal.type}:${item}`}
      actionLabel="Authorize & Pay"
      secondaryLabel="Defer Payment"
      busy={busy}
      onClose={onClose}
      onAction={() => save(true)}
      onSecondary={() => save(false)}
    />
  );
}

/* ------------------------------------------------------------------
   Auth Panel
------------------------------------------------------------------ */
function Auth({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await api(`/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body: form,
      });
      localStorage.setItem("plate-token", result.token);
      onLogin(result.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="glass-strong grid w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--line-bold)] lg:grid-cols-2">
        {/* Decorative Tech Visual */}
        <section className="relative hidden flex-col justify-between border-r border-[var(--line)] bg-[var(--hi)] p-8 lg:flex">
          <Logo size="lg" />
          <div className="my-8 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--cyan)]">
              <span className="led" /> LIVE STATUS ONLINE
            </div>
            <p className="mt-4 font-mono text-2xl font-extrabold text-[var(--ink)]">
              HOSTEL MESS TERMINAL
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Centralized dining operational suite. Access weekly meal matrices,
              instant digital passes, and ledger accounts.
            </p>
          </div>
          <div className="text-xs font-mono text-muted">
            SYS_LOC: IIIT Bhubaneswar Node // ENCRYPTED
          </div>
        </section>

        {/* Form */}
        <section className="flex items-center p-6 sm:p-10">
          <div className="w-full">
            <div className="mb-6 lg:hidden">
              <Logo />
            </div>
            <div className="kicker mb-1">// SECURITY VERIFICATION</div>
            <h2 className="text-2xl font-bold">
              {register ? "Create Access Account" : "Terminal Login"}
            </h2>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {register && (
                <>
                  <div>
                    <label className="field-label">Student Name</label>
                    <Input
                      required
                      placeholder="e.g. Alex Chen"
                      value={form.name || ""}
                      onChange={change("name")}
                    />
                  </div>
                  <div>
                    <label className="field-label">Hostel & Room Code</label>
                    <Input
                      placeholder="e.g. BH-1 204"
                      value={form.room || ""}
                      onChange={change("room")}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="field-label">Institutional Email</label>
                <Input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="student@iiit-bh.ac.in"
                  value={form.email || ""}
                  onChange={change("email")}
                />
              </div>
              <div>
                <label className="field-label">Security Key</label>
                <Input
                  required
                  minLength={6}
                  type="password"
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  value={form.password || ""}
                  onChange={change("password")}
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-[var(--danger)] bg-[rgba(239,68,68,0.1)] p-3 font-mono text-xs text-[var(--danger)]"
                >
                  ERR: {error}
                </p>
              )}

              <Button disabled={busy} className="w-full !py-3">
                {busy && <Spinner />}
                {busy
                  ? "AUTHENTICATING..."
                  : register
                    ? "REGISTER NODE"
                    : "AUTHENTICATE"}
              </Button>
            </form>

            <div className="mt-6 border-t border-[var(--line)] pt-4 text-center">
              <button
                type="button"
                className="link-btn text-xs"
                onClick={() => {
                  setRegister(!register);
                  setError("");
                }}
              >
                {register
                  ? "Switch to Login"
                  : "Create standard access account"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------
   Menu View
------------------------------------------------------------------ */
function Menu({ onRate, onBuy }) {
  const [menu, setMenu] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(currentDay);
  const [weekly, setWeekly] = useState(false);

  const load = () => {
    setLoading(true);
    return Promise.all([api("/menu"), api("/announcements")])
      .then(([m, a]) => {
        setMenu(m);
        setAnnouncements(a);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener("menu-updated", refresh);
    return () => window.removeEventListener("menu-updated", refresh);
  }, []);

  const mealsForDay = (selectedDay) =>
    mealTypes
      .map((type) =>
        menu.find((meal) => meal.day === selectedDay && meal.type === type),
      )
      .filter(Boolean);

  return (
    <div className="space-y-6">
      {announcements[0] && (
        <div className="metal flex items-center justify-between p-4 text-sm font-mono">
          <div className="flex items-center gap-3">
            <span className="led" />
            <span>
              <strong className="text-[var(--cyan)]">BROADCAST:</strong>{" "}
              {announcements[0].text}
            </span>
          </div>
        </div>
      )}

      <Heading
        title={
          weekly ? "7-DAY MENU MATRIX" : `${days[day].toUpperCase()} SCHEDULE`
        }
        sub={
          weekly
            ? "Full weekly operational breakdown."
            : "Select meal token to purchase access."
        }
      >
        <div className="seg">
          <button aria-pressed={!weekly} onClick={() => setWeekly(false)}>
            DAY
          </button>
          <button aria-pressed={weekly} onClick={() => setWeekly(true)}>
            WEEK MATRIX
          </button>
        </div>
      </Heading>

      {!weekly && (
        <div className="hide-scrollbar flex gap-2 overflow-auto py-1">
          {days.map((name, index) => (
            <button
              key={name}
              onClick={() => setDay(index)}
              className={`day-pill ${day === index ? "on" : ""}`}
            >
              <small>{index === currentDay ? "TODAY" : "DAY"}</small>
              {name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {mealTypes.map((type) => (
            <Card key={type} className="skeleton h-44" />
          ))}
        </div>
      ) : weekly ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {days.map((name, index) => (
            <Card key={name} strong={index === currentDay}>
              <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-2 font-mono">
                <strong className="text-lg text-[var(--cyan)]">{name}</strong>
                {index === currentDay && (
                  <span className="chip chip-ok">CURRENT</span>
                )}
              </div>
              <div className="space-y-2">
                {mealsForDay(index).map((meal) => (
                  <button
                    key={meal._id}
                    onClick={() => onBuy?.(meal)}
                    className="neu-press w-full rounded-lg border border-[var(--line)] bg-[var(--hi)] p-3 text-left"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[var(--cyan)]">
                        {meal.type.toUpperCase()}
                      </span>
                      <VegLed veg={meal.veg} />
                    </div>
                    <p className="mt-1 text-sm font-semibold">
                      {meal.items.join(", ")}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {mealTypes.map((type) => {
            const meal = menu.find((x) => x.day === day && x.type === type);
            return (
              <Card
                key={type}
                className="flex flex-col justify-between border-l-4 border-l-[var(--cyan)]"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                    <span className="flex items-center gap-2 font-mono font-bold uppercase text-[var(--cyan)]">
                      <span>{mealIcon[type]}</span>
                      {type}
                    </span>
                    {meal && <VegLed veg={meal.veg} />}
                  </div>

                  {meal ? (
                    <div className="mt-3">
                      <p className="text-lg font-bold">
                        {meal.items.join(", ")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="chip">
                          {meal.calories || "—"} KCAL
                        </span>
                        <span className="chip">
                          {meal.protein || "—"}G PROTEIN
                        </span>
                      </div>
                      {meal.allergens?.length > 0 && (
                        <p className="mt-3 font-mono text-xs text-[var(--danger)]">
                          ALLERGENS: {meal.allergens.join(", ")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 font-mono text-xs text-muted">
                      NO DATA RECORDED FOR SHIFT
                    </p>
                  )}
                </div>

                {meal && (
                  <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-3">
                    <Button
                      variant="primary"
                      className="!py-2 !text-xs"
                      onClick={() => onBuy?.(meal)}
                    >
                      BUY TOKEN · ₹{meal.price || 80}
                    </Button>
                    {onRate && (
                      <button
                        className="link-btn text-xs"
                        onClick={() => onRate(meal)}
                      >
                        RATE
                      </button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Fees & Ledger View
------------------------------------------------------------------ */
const LedgerRow = ({ title, note, right }) => (
  <div className="flex items-center justify-between gap-3 py-3 font-mono border-b border-[var(--line)] last:border-none">
    <div>
      <b className="text-sm text-[var(--ink)]">{title}</b>
      <p className="text-xs text-muted">{note}</p>
    </div>
    {right}
  </div>
);

function Fees() {
  const [fees, setFees] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () =>
    Promise.all([api("/fees"), api("/coupons")]).then(
      ([feeData, couponData]) => {
        setFees(feeData);
        setCoupons(couponData);
      },
    );

  useEffect(() => {
    load();
  }, []);

  const pending = fees.filter((fee) => fee.status === "pending");
  const pendingCoupons = coupons.filter(
    (coupon) => coupon.status === "pending",
  );
  const outstandingTotal =
    pending.reduce((sum, fee) => sum + (fee.amount || 0), 0) +
    pendingCoupons.reduce((sum, coupon) => sum + (coupon.price || 0), 0);

  const payAll = async () => {
    setBusy(true);
    try {
      await Promise.all([
        ...pending.map((fee) =>
          api(`/fees/${fee._id}/pay`, { method: "PATCH" }),
        ),
        ...pendingCoupons.map((coupon) =>
          api(`/coupons/${coupon._id}/pay`, { method: "PATCH" }),
        ),
      ]);
      await load();
      setPaymentOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="metal p-6">
          <p className="kicker">// OUTSTANDING LEDGER</p>
          <p className="mt-2 font-mono text-4xl font-extrabold text-[var(--cyan)]">
            ₹{pending.reduce((sum, fee) => sum + (fee.amount || 0), 0)}
          </p>
          <p className="mt-2 text-xs font-mono text-muted">
            Settle balances at mess desk terminal.
          </p>
        </div>
        <Card>
          <p className="kicker">// COMPLETED TRANSACTIONS</p>
          <p className="mt-2 font-mono text-4xl font-extrabold">
            {fees.filter((fee) => fee.status === "paid").length}
          </p>
          <p className="mt-2 text-xs font-mono text-muted">
            Verified payment entries.
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
        <Card>
          <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-2 font-mono">
            <h3 className="font-bold">UNSETTLED ITEMS</h3>
            <span className="chip chip-warn">
              {pending.length + pendingCoupons.length} PENDING
            </span>
          </div>
          <div>
            {pending.map((fee) => (
              <LedgerRow
                key={fee._id}
                title={fee.month}
                note="Monthly Fee Statement"
                right={<b className="text-[var(--cyan)]">₹{fee.amount}</b>}
              />
            ))}
            {pendingCoupons.map((coupon) => (
              <LedgerRow
                key={coupon._id}
                title={coupon.item}
                note={`${days[coupon.day]} ${coupon.type.toUpperCase()}`}
                right={<b className="text-[var(--cyan)]">₹{coupon.price}</b>}
              />
            ))}
            {!pending.length && !pendingCoupons.length && (
              <p className="py-4 text-center font-mono text-xs text-muted">
                LEDGER CLEAR - NO OUTSTANDING BALANCE
              </p>
            )}
          </div>
        </Card>
        <Card strong className="flex flex-col justify-between">
          <div>
            <div className="kicker">// TOTAL DUE NOW</div>
            <p className="mt-2 font-mono text-4xl font-extrabold text-[var(--cyan)]">
              ₹{outstandingTotal}
            </p>
            <p className="mt-2 text-xs text-muted">
              Consolidated checkout pass.
            </p>
          </div>
          <Button
            className="mt-6 w-full"
            disabled={!outstandingTotal}
            onClick={() => setPaymentOpen(true)}
          >
            AUTHORIZE ALL PAYMENTS
          </Button>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-2 font-mono">
          <h3 className="font-bold">TOKEN PURCHASE HISTORY</h3>
          <span className="chip">{coupons.length} RECORDS</span>
        </div>
        <div>
          {coupons.map((coupon) => (
            <LedgerRow
              key={coupon._id}
              title={coupon.item}
              note={`${days[coupon.day]} ${coupon.type.toUpperCase()} · ₹${coupon.price}`}
              right={<Status value={coupon.status} />}
            />
          ))}
        </div>
      </Card>

      {paymentOpen && (
        <QrDialog
          title="CONSOLIDATED PAYOUT"
          amount={outstandingTotal}
          data={`Daily_Thali-outstanding:${pending.map((f) => f._id).join(",")}:${pendingCoupons.map((c) => c._id).join(",")}`}
          actionLabel="CONFIRM PAID"
          busy={busy}
          onClose={() => setPaymentOpen(false)}
          onAction={payAll}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Feedback Diagnostics
------------------------------------------------------------------ */
const feedbackKinds = [
  {
    id: "quality",
    label: "QUALITY ALERT",
    hint: "Taste, texture, or temperature",
  },
  { id: "hygiene", label: "HYGIENE LOG", hint: "Cleanliness or sanitation" },
  { id: "rating", label: "MEAL SCORE", hint: "Rate a specific menu item" },
  {
    id: "feedback",
    label: "GENERAL NOTE",
    hint: "Direct operational feedback",
  },
];

function Feedback({ initialMeal }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    kind: initialMeal ? "rating" : "quality",
    rating: 5,
    meal: initialMeal ? `${days[initialMeal.day]} ${initialMeal.type}` : "",
  });

  const load = () => api("/feedback").then(setItems);
  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    setBusy(true);
    try {
      await api("/feedback", { method: "POST", body: form });
      setForm({ kind: "quality", rating: 5, meal: "" });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      {/* Input */}
      <section className="letter p-5">
        <div className="kicker mb-1">// NEW REPORT</div>
        <h3 className="text-xl font-bold">Transmit Feedback</h3>

        <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-4">
          {feedbackKinds.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setForm({ ...form, kind: k.id })}
              className={`kind-row ${form.kind === k.id ? "on" : ""}`}
            >
              <div className="min-w-0">
                <strong className="block text-xs font-mono text-[var(--cyan)]">
                  {k.label}
                </strong>
                <small className="text-xs text-muted">{k.hint}</small>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4 border-t border-[var(--line)] pt-4">
          {form.kind === "rating" && (
            <div className="space-y-3">
              <Input
                placeholder="Meal Shift Target (e.g. Tue Lunch)"
                value={form.meal}
                onChange={(e) => setForm({ ...form, meal: e.target.value })}
              />
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted">SCORE:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setForm({ ...form, rating: num })}
                      className={`star ${num <= form.rating ? "on" : ""}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <textarea
              className="ruled"
              rows="4"
              placeholder="Enter diagnostic report details..."
              value={form.text || ""}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
            />
          </div>

          <label className="flex items-center justify-between text-xs font-mono">
            ANONYMOUS SUBMISSION
            <input
              type="checkbox"
              checked={form.anon || false}
              onChange={(e) => setForm({ ...form, anon: e.target.checked })}
            />
          </label>

          <Button
            className="w-full"
            disabled={!form.text || busy}
            onClick={submit}
          >
            {busy && <Spinner />}
            {busy ? "TRANSMITTING..." : "SUBMIT REPORT"}
          </Button>
        </div>
      </section>

      {/* Log Feed */}
      <section className="space-y-4">
        <div className="kicker">// LOG HISTORICAL FEED</div>
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item._id} className="thread">
                <span className="thread-dot" />
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold uppercase text-[var(--cyan)]">
                    {item.kind}
                  </span>
                  <Status value={item.status} />
                </div>
                <p className="mt-2 text-sm">{item.text}</p>
                {item.reply && (
                  <div className="reply">
                    <span className="font-mono text-xs font-bold text-[var(--neon)]">
                      ADMIN RESPONSE:
                    </span>
                    <p className="mt-1 text-xs text-muted">{item.reply}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="empty-note font-mono text-xs text-muted">
            NO LOGS TRANSMITTED YET.
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------
   Admin Panel
------------------------------------------------------------------ */
function Admin() {
  const [meal, setMeal] = useState({ day: 0, type: "lunch", veg: true });
  const [announcement, setAnnouncement] = useState("");
  const [fee, setFee] = useState({});
  const [feedback, setFeedback] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => api("/feedback").then(setFeedback);
  useEffect(() => {
    load();
  }, []);

  const run = async (path, options) => {
    setBusy(true);
    setError("");
    try {
      await api(path, options);
      await load();
      if (path.includes("menu"))
        window.dispatchEvent(new Event("menu-updated"));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <div className="kicker mb-1">// MENU CONTROL</div>
          <h3 className="text-lg font-bold">Update Meal Shift</h3>
          {error && (
            <p className="mt-2 font-mono text-xs text-[var(--danger)]">
              {error}
            </p>
          )}
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select
                options={days}
                onChange={(e) =>
                  setMeal({ ...meal, day: days.indexOf(e.target.value) })
                }
              />
              <Select
                options={mealTypes}
                value={meal.type}
                onChange={(e) => setMeal({ ...meal, type: e.target.value })}
              />
            </div>
            <Input
              placeholder="Items (comma-separated)"
              onChange={(e) =>
                setMeal({
                  ...meal,
                  items: e.target.value.split(",").map((i) => i.trim()),
                })
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Calories"
                onChange={(e) =>
                  setMeal({ ...meal, calories: +e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Protein (g)"
                onChange={(e) => setMeal({ ...meal, protein: +e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 font-mono text-xs">
              <input
                type="checkbox"
                checked={meal.veg}
                onChange={(e) => setMeal({ ...meal, veg: e.target.checked })}
              />
              VEGETARIAN SHIFT
            </label>
            <Button
              className="w-full"
              onClick={() => run("/menu", { method: "POST", body: meal })}
            >
              {busy ? "SAVING..." : "COMMIT MEAL TO SCHEDULE"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="kicker mb-1">// BROADCAST SYSTEM</div>
          <h3 className="text-lg font-bold">Post Global Notice</h3>
          <div className="mt-4 space-y-3">
            <Input
              value={announcement}
              placeholder="Notice message..."
              onChange={(e) => setAnnouncement(e.target.value)}
            />
            <Button
              disabled={!announcement || busy}
              onClick={() =>
                run("/announcements", {
                  method: "POST",
                  body: { text: announcement },
                }).then(() => setAnnouncement(""))
              }
            >
              TRANSMIT BROADCAST
            </Button>
          </div>
        </Card>
      </div>

      <Card className="h-fit">
        <div className="kicker mb-1">// FEEDBACK QUEUE</div>
        <h3 className="text-lg font-bold">Incoming User Logs</h3>
        <div className="mt-4 space-y-3">
          {feedback.map((item) => (
            <div
              key={item._id}
              className="border-t border-[var(--line)] pt-3 text-xs font-mono"
            >
              <div className="flex justify-between text-[var(--cyan)]">
                <b>{item.kind.toUpperCase()}</b>
                <span>{item.user?.name || "ANONYMOUS"}</span>
              </div>
              <p className="my-2 font-sans text-sm text-[var(--ink)]">
                {item.text}
              </p>
              <div className="flex gap-2">
                <Select
                  options={["open", "in-progress", "resolved"]}
                  value={item.status}
                  onChange={(e) =>
                    run(`/feedback/${item._id}`, {
                      method: "PATCH",
                      body: { status: e.target.value, reply: item.reply },
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------
   Home / Dashboard Component
------------------------------------------------------------------ */
function Home({ user, setTab }) {
  const [menu, setMenu] = useState([]);
  const [update, setUpdate] = useState(null);

  useEffect(() => {
    api("/menu").then(setMenu);
    api("/announcements")
      .then((list) => setUpdate(list[0] || null))
      .catch(() => {});
  }, []);

  const todayMeals = mealTypes
    .map((type) => menu.find((m) => m.day === currentDay && m.type === type))
    .filter(Boolean);

  const hour = new Date().getHours();
  const nextType =
    hour < 10
      ? "breakfast"
      : hour < 15
        ? "lunch"
        : hour < 18
          ? "snacks"
          : hour < 22
            ? "dinner"
            : null;
  const next = todayMeals.find((m) => m.type === nextType);

  return (
    <div className="space-y-6">
      {update && (
        <button
          onClick={() => setTab("Announcements")}
          className="metal flex w-full items-center justify-between p-4 text-left font-mono text-xs"
        >
          <div className="flex items-center gap-3">
            <span className="led" style={{ "--c": "var(--amber)" }} />
            <span>
              <strong className="text-[var(--amber)]">NOTICE:</strong>{" "}
              {update.text}
            </span>
          </div>
          <span>[VIEW]</span>
        </button>
      )}

      <section className="glass-strong p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <div className="kicker mb-1">// SYSTEM READY · USER LOGGED IN</div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              Welcome back,{" "}
              <span className="text-[var(--cyan)]">
                {user.name.split(" ")[0]}
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted">
              Campus mess operational HUD. Select an active menu shift or
              generate single-use meal access tokens.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => setTab("Menu")}>OPEN MENU MATRIX</Button>
              <Button variant="soft" onClick={() => setTab("Fees")}>
                CHECK BALANCE
              </Button>
            </div>
          </div>

          {next && (
            <div className="flex flex-col justify-between rounded-xl border border-[var(--cyan)] bg-[var(--hi)] p-5 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
              <div>
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-[var(--cyan)] font-bold">
                    // NEXT ACTIVE SHIFT
                  </span>
                  <span className="chip chip-ok">UPCOMING</span>
                </div>
                <h3 className="mt-2 font-mono text-xl font-bold uppercase">
                  {next.type}
                </h3>
                <p className="mt-1 text-sm">{next.items.join(", ")}</p>
              </div>
              <div className="mt-4 border-t border-[var(--line)] pt-2 font-mono text-xs text-muted">
                CALORIES: {next.calories || "—"} KCAL
              </div>
            </div>
          )}
        </div>
      </section>

      <Card>
        <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3 font-mono">
          <div>
            <h3 className="font-bold">TODAY'S SHIFT MATRIX</h3>
            <span className="text-xs text-muted">
              {days[currentDay].toUpperCase()} OPERATIONAL SCHEDULE
            </span>
          </div>
          <button className="link-btn text-xs" onClick={() => setTab("Menu")}>
            FULL MATRIX →
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {todayMeals.map((meal) => (
            <button
              key={meal._id}
              onClick={() => setTab("Menu")}
              className="neu-press flex flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--hi)] p-4 text-left"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-[var(--cyan)] uppercase">
                    {meal.type}
                  </span>
                  <VegLed veg={meal.veg} />
                </div>
                <p className="mt-2 text-sm font-semibold">
                  {meal.items.join(", ")}
                </p>
              </div>
              <div className="mt-4 font-mono text-xs text-muted">
                ₹{meal.price || 80} · {meal.calories || "—"} KCAL
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------
   Main App Container & Layout
------------------------------------------------------------------ */
export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("Home");
  const [feedbackMeal, setFeedbackMeal] = useState(null);
  const [couponMeal, setCouponMeal] = useState(null);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("hb-dark") !== "0",
  );

  useEffect(() => {
    document.title = "Daily_Thali Node HUD";
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("hb-dark", darkMode ? "1" : "0");
  }, [darkMode]);

  useEffect(() => {
    const token = localStorage.getItem("plate-token");
    if (!token) {
      setReady(true);
      return;
    }
    api("/me")
      .then(setUser)
      .catch(() => localStorage.removeItem("plate-token"))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center font-mono text-xs text-[var(--cyan)]">
        INITIALIZING TERMINAL DATA ENGINE...
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  const tabs =
    user.role === "admin"
      ? [
          { id: "Home", label: "OVERVIEW", icon: "⌂" },
          { id: "Menu", label: "MATRIX", icon: "🍱" },
          { id: "Admin", label: "CONTROL", icon: "⚙" },
        ]
      : [
          { id: "Home", label: "HUD", icon: "⌂" },
          { id: "Menu", label: "MATRIX", icon: "🍱" },
          { id: "Fees", label: "LEDGER", icon: "₹" },
          { id: "Feedback", label: "REPORTS", icon: "💬" },
        ];

  const logout = () => {
    localStorage.removeItem("plate-token");
    setUser(null);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Background Effect */}
      <div className="aurora" aria-hidden="true">
        <i />
        <i />
      </div>

      {/* Futuristic Top Bar Navigation */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--glass)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />

          {/* Desktop Nav Pills */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`dock-item ${tab === item.id ? "on" : ""}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs text-right sm:block">
              <span className="block font-bold text-[var(--cyan)]">
                {user.name}
              </span>
              <span className="text-muted uppercase">{user.role} NODE</span>
            </span>
            <ThemeSwitch
              dark={darkMode}
              onClick={() => setDarkMode(!darkMode)}
            />
            <button
              onClick={logout}
              title="Disconnect Node"
              className="rounded-lg border border-[var(--line)] p-2 font-mono text-xs font-bold text-[var(--danger)] hover:bg-[rgba(239,68,68,0.1)]"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {tab === "Home" && <Home user={user} setTab={setTab} />}
        {tab === "Menu" && (
          <Menu
            onBuy={setCouponMeal}
            onRate={(meal) => {
              setFeedbackMeal(meal);
              setTab("Feedback");
            }}
          />
        )}
        {tab === "Fees" && user.role !== "admin" && <Fees />}
        {tab === "Feedback" && user.role !== "admin" && (
          <Feedback initialMeal={feedbackMeal} />
        )}
        {tab === "Admin" && user.role === "admin" && <Admin />}
      </main>

      {/* Mobile Floating Dock Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center border-t border-[var(--line)] bg-[var(--glass)] p-2 backdrop-blur-md md:hidden">
        <div className="flex gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`dock-item ${tab === item.id ? "on" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Coupon Modal */}
      {couponMeal && (
        <CouponDialog
          meal={couponMeal}
          onClose={() => setCouponMeal(null)}
          onRate={(meal) => {
            setCouponMeal(null);
            setFeedbackMeal(meal);
            setTab("Feedback");
          }}
        />
      )}
    </div>
  );
}
