import FormInput from "./FormInput";
import FormTextarea from "./FormTextarea";
import NavigationButtons from "./NavigationButtons";

export type AchievementData = {
  title: string;
  organization: string;
  date: string;
  description: string;
};

type AchievementsFormProps = {
  data: AchievementData[];
  onChange: (
    index: number,
    field: keyof AchievementData,
    value: string
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function AchievementsForm({
  data,
  onChange,
  onAdd,
  onRemove,
  onBack,
  onNext,
}: AchievementsFormProps) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8">

      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
          Achievements
        </h2>

        <p className="mt-2 text-sm sm:text-base text-on-surface-variant">
          Add awards, hackathons, competitions, leadership achievements,
          or other accomplishments.
        </p>
      </div>

      <div className="space-y-8">

        {data.map((achievement, index) => (
          <div
            key={index}
            className="border border-outline-variant rounded-2xl p-5 sm:p-6"
          >

            <div className="flex items-center justify-between mb-6">

              <h3 className="text-lg font-bold text-on-surface">
                Achievement {index + 1}
              </h3>

              {data.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}

            </div>

            <div className="space-y-5">

              <FormInput
                label="Achievement / Title"
                value={achievement.title}
                onChange={(value) =>
                  onChange(index, "title", value)
                }
                placeholder="Enter achievement or award"
              />

              <FormInput
                label="Organization"
                value={achievement.organization}
                onChange={(value) =>
                  onChange(index, "organization", value)
                }
                placeholder="Enter organization or event"
              />

              <FormInput
                label="Date"
                value={achievement.date}
                onChange={(value) =>
                  onChange(index, "date", value)
                }
                placeholder="Enter date"
              />

              <FormTextarea
                label="Description"
                value={achievement.description}
                onChange={(value) =>
                  onChange(index, "description", value)
                }
                placeholder="Describe your achievement"
                rows={5}
              />

            </div>

          </div>
        ))}

      </div>

      <button
        type="button"
        onClick={onAdd}
        className="
          mt-6
          w-full
          py-3
          rounded-xl
          border
          border-dashed
          border-primary
          text-primary
          font-medium
          hover:bg-primary/5
          transition-colors
        "
      >
        + Add Another Achievement
      </button>

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
      />

    </section>
  );
}