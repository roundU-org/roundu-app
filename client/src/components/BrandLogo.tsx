/** RoundU logo pieces. `lockup` = mark + "roundu"; use tone="light" on dark backgrounds. */
const BrandLogo = ({
  variant = "lockup",
  tone = "dark",
  className = "h-8",
}: {
  variant?: "lockup" | "mark" | "wordmark" | "stacked";
  tone?: "dark" | "light";
  className?: string;
}) => {
  const word = tone === "light" ? "/brand/roundu-wordmark-light.png" : "/brand/roundu-wordmark.png";
  const mark =
    tone === "light" ? (
      <span className="grid aspect-square h-full place-items-center rounded-full bg-paper p-[8%]">
        <img src="/brand/roundu-mark-192.png" alt="" className="h-full w-full" />
      </span>
    ) : (
      <img src="/brand/roundu-mark-192.png" alt="" className="h-full w-auto" />
    );

  if (variant === "mark") return <span className={`inline-flex ${className}`} role="img" aria-label="RoundU">{mark}</span>;
  if (variant === "wordmark") return <img src={word} alt="RoundU" className={`w-auto ${className}`} />;
  if (variant === "stacked")
    return (
      <span className="inline-flex flex-col items-center gap-5" role="img" aria-label="RoundU">
        <img src="/brand/roundu-mark.png" alt="" className={`w-auto ${className}`} />
        <img src={word} alt="" className="h-9 w-auto" />
      </span>
    );
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="img" aria-label="RoundU">
      {mark}
      <img src={word} alt="" className="h-[68%] w-auto" />
    </span>
  );
};

export default BrandLogo;
