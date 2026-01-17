// components/sparkline.tsx
type Props = {
    data: number[];
    negative?: boolean;
};

export function Sparkline({ data, negative }: Props) {
    const points = data
        .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - v}`)
        .join(" ");

    return (
        <svg viewBox="0 0 100 100" className="h-8 w-24">
            <polyline
                fill="none"
                stroke={negative ? "#ef4444" : "#22c55e"}
                strokeWidth="3"
                points={points}
            />
        </svg>
    );
}
