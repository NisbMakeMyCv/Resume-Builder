import FormInput from "./FormInput";
import NavigationButtons from "./NavigationButtons";

export type SkillData = {
  name: string;
  category: string;
};

type SkillsFormProps = {
  data: SkillData[];
  onChange: (
    index: number,
    field: keyof SkillData,
    value: string
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
};

const categories = [
  "Programming Language",
  "Framework / Library",
  "Database",
  "Cloud / DevOps",
  "Tools",
  "Soft Skill",
  "Other",
];

export default function SkillsForm({
  data,
  onChange,
  onAdd,
  onRemove,
  onBack,
  onNext,
}: SkillsFormProps) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8">

      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
          Skills
        </h2>

        <p className="mt-2 text-sm sm:text-base text-on-surface-variant">
          Add your technical and professional skills.
        </p>
      </div>

      <div className="space-y-6">

        {data.map((skill, index) => (
          <div
            key={index}
            className="border border-outline-variant rounded-2xl p-5 sm:p-6"
          >

            <div className="flex items-center justify-between mb-5">

              <h3 className="text-lg font-bold text-on-surface">
                Skill {index + 1}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <FormInput
                label="Skill"
                value={skill.name}
                onChange={(value) =>
                  onChange(index, "name", value)
                }
                placeholder="Enter skill"
              />

              <div className="space-y-2">

                <label className="block text-sm font-medium text-on-surface">
                  Category
                </label>

                <select
                  value={skill.category}
                  onChange={(e) =>
                    onChange(
                      index,
                      "category",
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    border
                    border-outline-variant
                    bg-surface
                    text-on-surface
                    outline-none
                    focus:border-primary
                    focus:ring-2
                    focus:ring-primary/10
                  "
                >

                  <option value="">
                    Select category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}

                </select>

              </div>

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
        + Add Another Skill
      </button>

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
      />

    </section>
  );
}