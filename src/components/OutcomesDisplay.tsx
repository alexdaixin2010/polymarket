const COLORS = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#dc2626", "#0891b2"];

interface Outcome {
  name: string;
  price: number;
}

interface OutcomesDisplayProps {
  outcomes: Outcome[];
}

export default function OutcomesDisplay({ outcomes }: OutcomesDisplayProps) {
  if (outcomes.length === 0) return null;

  const isBinary =
    outcomes.length === 2 &&
    outcomes[0].name.toLowerCase() === "yes" &&
    outcomes[1].name.toLowerCase() === "no";

  if (isBinary) {
    const yesPrice = outcomes[0].price;
    return (
      <div>
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold text-blue-600">
            {Math.round(yesPrice * 100)}% Yes
          </span>
          <span className="font-semibold text-gray-400">
            {Math.round((1 - yesPrice) * 100)}% No
          </span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${yesPrice * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // Sort by price descending for display
  const sorted = [...outcomes].sort((a, b) => b.price - a.price);

  return (
    <div className="space-y-3">
      {sorted.map((outcome, i) => {
        const color = COLORS[outcomes.indexOf(outcome) % COLORS.length];
        return (
          <div key={outcome.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium" style={{ color }}>
                {outcome.name}
              </span>
              <span className="font-semibold text-gray-900">
                {Math.round(outcome.price * 100)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(outcome.price * 100, 0.5)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
