type NavigationButtonsProps = {
  onBack?: () => void;
  onNext: () => void;
  nextText?: string;
};

export default function NavigationButtons({
  onBack,
  onNext,
  nextText = "Next →",
}: NavigationButtonsProps) {
  return (
    <div className="flex justify-between items-center mt-8 pt-4">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="
            px-6
            py-3
            rounded-full
            border
            border-outline-variant
            text-on-surface
            font-medium
            hover:bg-surface-container
            transition-colors
          "
        >
          ← Back
        </button>
      ) : (
        <div />
      )}

      <button
        type="button"
        onClick={onNext}
        className="
          px-7
          py-3
          rounded-full
          bg-primary
          text-on-primary
          font-medium
          hover:bg-secondary
          transition-colors
          active:scale-95
        "
      >
        {nextText}
      </button>
    </div>
  );
}