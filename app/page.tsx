import TrendChart from "@/components/TrendChart";
import {
  CATEGORY_KEYS,
  CATEGORY_MEANINGS,
  type CategoryKey,
  type Exercise,
  fetchExercises,
  formatExerciseLong,
  formatExerciseShort,
  formatMoney,
  formatMonthLong,
  formatNumber,
} from "@/lib/coe";

function PremiumChange({
  latest,
  previous,
}: {
  latest: number;
  previous: number | undefined;
}) {
  if (previous === undefined) {
    return <span className="text-sm text-neutral-500">—</span>;
  }
  const diff = latest - previous;
  if (diff === 0) {
    return <span className="text-sm text-neutral-500">— unchanged</span>;
  }
  if (diff > 0) {
    return (
      <span className="text-sm text-[#b5484d] tabular-nums">
        ▲ {formatMoney(diff)}
      </span>
    );
  }
  return (
    <span className="text-sm text-neutral-500 tabular-nums">
      ▼ {formatMoney(-diff)}
    </span>
  );
}

function LatestResultsCard({
  latest,
  previous,
}: {
  latest: Exercise;
  previous: Exercise | undefined;
}) {
  return (
    <section className="bg-white rounded-xl border border-neutral-200/80 shadow-sm p-6">
      <h2 className="font-mono text-xs tracking-widest uppercase text-neutral-500">
        {formatExerciseLong(latest)}
      </h2>
      <ul className="mt-4 divide-y divide-neutral-200">
        {CATEGORY_KEYS.map((key) => {
          const result = latest.categories[key];
          if (!result) return null;
          const ratio = result.quota > 0 ? result.bidsReceived / result.quota : 0;
          return (
            <li key={key} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-medium">Cat {key}</span>
                  <p className="text-xs text-neutral-500 text-pretty">
                    {CATEGORY_MEANINGS[key]}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl sm:text-2xl font-semibold tabular-nums">
                    {formatMoney(result.premium)}
                  </p>
                  <PremiumChange
                    latest={result.premium}
                    previous={previous?.categories[key]?.premium}
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-neutral-500 tabular-nums">
                Quota {formatNumber(result.quota)} ·{" "}
                {formatNumber(result.bidsReceived)} bids ·{" "}
                {result.quota > 0 ? `${ratio.toFixed(1)}× subscribed` : "no quota"}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function HistoryCard({ exercises }: { exercises: Exercise[] }) {
  const recent = exercises.slice(-8).reverse();
  return (
    <section className="bg-white rounded-xl border border-neutral-200/80 shadow-sm p-6">
      <h2 className="font-mono text-xs tracking-widest uppercase text-neutral-500">
        History — last 8 exercises
      </h2>
      <div className="mt-4 divide-y divide-neutral-200">
        {CATEGORY_KEYS.map((key) => (
          <details key={key} className="group py-3 first:pt-0 last:pb-0">
            <summary className="flex items-baseline justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:text-[#b5484d] transition-colors">
              <span className="font-medium">Cat {key}</span>
              <span className="text-xs text-neutral-500 group-open:hidden">
                show
              </span>
              <span className="text-xs text-neutral-500 hidden group-open:inline">
                hide
              </span>
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="font-mono text-xs tracking-widest uppercase text-neutral-500">
                    <th className="text-left font-normal pb-2">Exercise</th>
                    <th className="text-right font-normal pb-2">Quota</th>
                    <th className="text-right font-normal pb-2">Bids</th>
                    <th className="text-right font-normal pb-2">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {recent.map((ex) => {
                    const result = ex.categories[key];
                    if (!result) return null;
                    return (
                      <tr key={`${ex.month}-${ex.biddingNo}`}>
                        <td className="py-2 font-mono text-xs text-neutral-500 whitespace-nowrap">
                          {formatExerciseShort(ex)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatNumber(result.quota)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatNumber(result.bidsReceived)}
                        </td>
                        <td className="py-2 text-right tabular-nums font-medium">
                          {formatMoney(result.premium)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function ExplainerCard() {
  return (
    <section className="bg-white rounded-xl border border-neutral-200/80 shadow-sm p-6">
      <h2 className="font-mono text-xs tracking-widest uppercase text-neutral-500">
        The five categories
      </h2>
      <ul className="mt-4 space-y-2 text-sm text-neutral-500">
        {CATEGORY_KEYS.map((key: CategoryKey) => (
          <li key={key}>
            <span className="font-medium text-neutral-900">Cat {key}</span> —{" "}
            {CATEGORY_MEANINGS[key]}
          </li>
        ))}
      </ul>
      <p className="mt-4 pt-4 border-t border-neutral-200 text-sm text-neutral-500 text-pretty">
        Bidding exercises usually open on the first and third Monday of the
        month and close the following Wednesday.
      </p>
    </section>
  );
}

export default async function Page() {
  const exercises = await fetchExercises();
  const latest = exercises?.[exercises.length - 1];
  const previous =
    exercises && exercises.length > 1
      ? exercises[exercises.length - 2]
      : undefined;

  return (
    <main className="min-h-dvh bg-[#faf9f7] text-neutral-900">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <header className="mb-8">
          <a
            href="https://www.lifekit.sg"
            className="font-mono text-xs tracking-widest uppercase text-neutral-500 hover:text-[#b5484d] transition-colors"
          >
            lifekit.sg / transport
          </a>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 mb-3">
            COE Tracker
          </h1>
          <p className="text-sm text-neutral-500 max-w-md text-pretty">
            Latest Certificate of Entitlement premiums and two years of trend,
            straight from LTA&apos;s bidding results.
          </p>
          {latest && (
            <p className="mt-3 text-xs text-neutral-500">
              Data as of bidding exercise {latest.biddingNo} ·{" "}
              {formatMonthLong(latest.month)}
            </p>
          )}
        </header>

        {latest ? (
          <div className="space-y-6">
            <LatestResultsCard latest={latest} previous={previous} />
            {exercises && (
              <section className="bg-white rounded-xl border border-neutral-200/80 shadow-sm p-6">
                <h2 className="font-mono text-xs tracking-widest uppercase text-neutral-500 mb-4">
                  Premium trend — last 24 exercises
                </h2>
                <TrendChart exercises={exercises} />
              </section>
            )}
            {exercises && <HistoryCard exercises={exercises} />}
            <ExplainerCard />
          </div>
        ) : (
          <div className="space-y-6">
            <section className="bg-white rounded-xl border border-neutral-200/80 shadow-sm p-6">
              <p className="text-sm text-neutral-500">
                Live data is temporarily unavailable — try again shortly.
              </p>
            </section>
            <ExplainerCard />
          </div>
        )}

        <footer className="mt-10 pt-6 border-t border-neutral-200 text-sm text-neutral-500 space-y-1">
          <p>
            Part of{" "}
            <a
              href="https://www.lifekit.sg"
              className="underline underline-offset-2 hover:text-[#b5484d] transition-colors"
            >
              lifekit.sg
            </a>{" "}
            — free tools for living in Singapore.
          </p>
          <p>
            Data: LTA COE bidding results via{" "}
            <a
              href="https://data.gov.sg/datasets/d_69b3380ad7e51aff3a7dcc84eba52b8a/view"
              className="underline underline-offset-2 hover:text-[#b5484d] transition-colors"
            >
              data.gov.sg
            </a>
            , refreshed after each bidding exercise.
          </p>
        </footer>
      </div>
    </main>
  );
}
