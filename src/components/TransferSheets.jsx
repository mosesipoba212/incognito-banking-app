import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { theme, fonts } from "../lib/theme.js";
import { fmtGBP } from "../lib/format.js";
import { Sheet, AmountInput, PrimaryButton, ErrorNote, Spinner } from "./ui.jsx";
import { PinEntry } from "./PinLock.jsx";

/**
 * The five quick-action bottom sheets shared across tabs: add money, move
 * between own accounts, send to a payee, the transaction-PIN confirmation
 * step, and buying a stock. Bundled together since they all share the same
 * `sheet`/`amount`/`sheetError` state living in the Dashboard component.
 */
export default function TransferSheets({
  sheet,
  closeSheet,
  amount,
  setAmount,
  sheetError,
  openAccounts,
  primaryAccountId,

  addToAccountId,
  setAddToAccountId,
  handleAddMoney,

  moveFromId,
  setMoveFromId,
  moveToId,
  setMoveToId,
  handleMove,

  payees,
  sendTarget,
  setSendTarget,
  sendFromId,
  setSendFromId,
  handleSend,

  txnPinThreshold,
  handlePinConfirm,
  pinConfirmError,

  activeStock,
  activeHistory,
  historyLoading,
  portfolio,
  investCash,
  hideBalance,
  handleBuy,
}) {
  return (
    <>
      {sheet === "add" && (
        <Sheet title="Add money" onClose={closeSheet}>
          {openAccounts.length > 1 && (
            <div className="flex flex-col gap-1.5 mb-4">
              <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>To account</span>
              <select
                value={addToAccountId || primaryAccountId}
                onChange={(e) => setAddToAccountId(e.target.value)}
                style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
                className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
              >
                {openAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <AmountInput value={amount} onChange={setAmount} autoFocus />
          <PrimaryButton onClick={handleAddMoney} disabled={!amount || parseFloat(amount) <= 0}>
            Add money
          </PrimaryButton>
        </Sheet>
      )}

      {sheet === "move" && (
        <Sheet title="Move money" onClose={closeSheet}>
          <div className="flex gap-2 mb-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>From</span>
              <select
                value={moveFromId || ""}
                onChange={(e) => setMoveFromId(e.target.value)}
                style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
                className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
              >
                {openAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>To</span>
              <select
                value={moveToId || ""}
                onChange={(e) => setMoveToId(e.target.value)}
                style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
                className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
              >
                {openAccounts.filter((a) => a.id !== moveFromId).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <AmountInput value={amount} onChange={setAmount} autoFocus />
          <ErrorNote>{sheetError}</ErrorNote>
          <PrimaryButton onClick={handleMove} disabled={!amount || parseFloat(amount) <= 0 || !moveToId}>
            Move money
          </PrimaryButton>
        </Sheet>
      )}

      {sheet === "send" && (
        <Sheet title={sendTarget ? `Send to ${sendTarget.name}` : "Send money"} onClose={closeSheet}>
          {!sendTarget && (
            <div className="flex flex-col gap-2 mb-4 max-h-40 overflow-y-auto">
              {payees.length === 0 && (
                <div style={{ color: theme.textFaint, fontSize: 13 }} className="text-center py-2">
                  Add a payee first from the Payments tab.
                </div>
              )}
              {payees.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSendTarget(p)}
                  style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
                  className="text-left px-4 py-2.5 rounded-xl text-sm"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
          {sendTarget && (
            <>
              {openAccounts.length > 1 && (
                <div className="flex flex-col gap-1.5 mb-4">
                  <span style={{ color: theme.textDim, fontFamily: fonts.body, fontSize: 12 }}>From</span>
                  <select
                    value={sendFromId || primaryAccountId}
                    onChange={(e) => setSendFromId(e.target.value)}
                    style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
                    className="w-full px-4 py-3 rounded-2xl outline-none text-sm"
                  >
                    {openAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <AmountInput value={amount} onChange={setAmount} autoFocus />
              <ErrorNote>{sheetError}</ErrorNote>
              <PrimaryButton onClick={handleSend} disabled={!amount || parseFloat(amount) <= 0}>
                Send money
              </PrimaryButton>
            </>
          )}
        </Sheet>
      )}

      {sheet === "pinConfirm" && (
        <Sheet title="Confirm with your PIN" onClose={closeSheet}>
          <PinEntry
            prompt={`This transfer is over ${fmtGBP(txnPinThreshold)} — enter your PIN to confirm.`}
            onComplete={handlePinConfirm}
            error={pinConfirmError}
          />
        </Sheet>
      )}

      {sheet === "stock" && activeStock && (
        <Sheet title={`${activeStock.symbol} · ${activeStock.name}`} onClose={closeSheet}>
          <div className="flex items-center justify-between mb-3">
            <div style={{ color: theme.text, fontFamily: fonts.display, fontSize: 26 }}>
              £{activeStock.price.toLocaleString("en-GB", { maximumFractionDigits: 2 })}
            </div>
            <div style={{ color: activeStock.chg >= 0 ? theme.green : theme.red, fontFamily: fonts.mono, fontSize: 13 }} className="flex items-center gap-1">
              {activeStock.chg >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(activeStock.chg).toFixed(1)}%
            </div>
          </div>
          <div style={{ height: 110 }} className="mb-4 relative">
            {historyLoading && (
              <div className="absolute top-0 right-0 z-10" title="Updating live chart…">
                <Spinner size={14} color={theme.textFaint} />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeHistory || activeStock.history}>
                <defs>
                  <linearGradient id="detailFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.accent} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={theme.accent} strokeWidth={2} fill="url(#detailFill)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ color: theme.textFaint, fontFamily: fonts.body, fontSize: 12, marginBottom: 4 }}>
            You hold {(portfolio[activeStock.symbol] || 0).toFixed(3)} shares · Invest cash {fmtGBP(investCash, hideBalance)}
          </div>
          <AmountInput value={amount} onChange={setAmount} />
          <ErrorNote>{sheetError}</ErrorNote>
          <PrimaryButton onClick={handleBuy} disabled={!amount || parseFloat(amount) <= 0}>
            Buy {activeStock.symbol}
          </PrimaryButton>
        </Sheet>
      )}
    </>
  );
}
