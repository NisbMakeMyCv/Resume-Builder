import FormInput from "./FormInput";
import NavigationButtons from "./NavigationButtons";

type EducationData = {
  institution: string;
  location: string;
  degree: string;
  dates: string;
};

type EducationFormProps = {
  data: EducationData;
  onChange: (
    field: keyof EducationData,
    value: string
  ) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function EducationForm({
  data,
  onChange,
  onBack,
  onNext,
}: EducationFormProps) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8">

      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
          Education
        </h2>

        <p className="mt-2 text-sm text-on-surface-variant">
          Add your educational background.
        </p>
      </div>

      <div className="space-y-5">

        <FormInput
          label="Institution"
          value={data.institution}
          onChange={(value) => onChange("institution", value)}
          placeholder="Enter your institution"
        />

        <FormInput
          label="Location"
          value={data.location}
          onChange={(value) => onChange("location", value)}
          placeholder="Enter your location"
        />

        <FormInput
          label="Degree"
          value={data.degree}
          onChange={(value) => onChange("degree", value)}
          placeholder="Enter your degree"
        />

        <FormInput
          label="Dates"
          value={data.dates}
          onChange={(value) => onChange("dates", value)}
          placeholder="Enter your study period"
        />

      </div>

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
      />

    </section>
  );
}