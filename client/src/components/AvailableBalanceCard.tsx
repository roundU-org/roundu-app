import React from 'react';

interface AvailableBalanceCardProps {
  walletBalance: number;
  commissionDue: number;
  codPendingCount: number;
  onWithdraw: () => void;
}

const AvailableBalanceCard: React.FC<AvailableBalanceCardProps> = ({
  walletBalance,
  commissionDue,
  codPendingCount,
  onWithdraw,
}) => {
  const platformFee = 0;

  const withdrawableBalance = walletBalance;

  return (
    <div className="w-full rounded-[24px] bg-navy p-6 text-paper">
      <p className="text-[13px] text-paper/60">Withdrawable balance</p>
      <p className={`mt-1 text-[38px] font-semibold leading-none tracking-[-0.02em] tabular-nums ${withdrawableBalance < 0 ? "text-[#F2A091]" : ""}`}>
        ₹{withdrawableBalance.toLocaleString("en-IN")}
      </p>

      <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-[13.5px]">
        <Line label="Wallet balance" value={`₹${walletBalance.toLocaleString("en-IN")}`} warn={walletBalance < 0} />
        <Line label="Platform fee" value="Already deducted" />
        <Line label="Commission due" value={`₹${commissionDue.toLocaleString("en-IN")}`} warn={commissionDue > 0} />
        <Line label="Cash jobs pending" value={String(codPendingCount)} />
      </div>

      <button onClick={onWithdraw} className="mt-6 w-full rounded-[14px] bg-paper py-3.5 text-[15px] font-semibold text-navy transition-transform active:scale-[0.98]">
        Withdraw to bank
      </button>
    </div>
  );
};

const Line = ({ label, value, warn }: { label: string; value: string; warn?: boolean }) => (
  <div className="flex justify-between">
    <span className="text-paper/60">{label}</span>
    <span className={`font-medium tabular-nums ${warn ? "text-[#FFB067]" : ""}`}>{value}</span>
  </div>
);

export default AvailableBalanceCard;