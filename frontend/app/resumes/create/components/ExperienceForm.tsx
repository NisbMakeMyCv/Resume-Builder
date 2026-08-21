import FormInput from "./FormInput";
import FormTextarea from "./FormTextarea";
import NavigationButtons from "./NavigationButtons";

type ExperienceData = {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
};

type ExperienceFormProps = {
  data: ExperienceData;
  onChange: (
    field: keyof ExperienceData,
    value: string
  ) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function ExperienceForm({
  data,
  onChange,
  onBack,
  onNext,
}: ExperienceFormProps) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8">

      {/* Header */}

      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
          Experience
        </h2>

        <p className="mt-2 text-sm sm:text-base text-on-surface-variant">
          Add your work experience, internships, or professional experience.
        </p>
      </div>

      {/* Fields */}

      <div className="space-y-5">

        <FormInput
          label="Company / Organization"
          value={data.company}
          onChange={(value) => onChange("company", value)}
          placeholder="Enter company or organization"
        />

        <FormInput
          label="Role / Position"
          value={data.role}
          onChange={(value) => onChange("role", value)}
          placeholder="Enter your role or position"
        />

        <FormInput
          label="Location"
          value={data.location}
          onChange={(value) => onChange("location", value)}
          placeholder="Enter your work location"
        />

        <FormInput
          label="Start Date"
          value={data.startDate}
          onChange={(value) => onChange("startDate", value)}
          placeholder="Enter start date"
        />

        <FormInput
          label="End Date"
          value={data.endDate}
          onChange={(value) => onChange("endDate", value)}
          placeholder="Enter end date or Present"
        />

        <FormTextarea
          label="Description"
          value={data.description}
          onChange={(value) => onChange("description", value)}
          placeholder="Describe your responsibilities, achievements, and contributions"
          rows={6}
        />

      </div>

      {/* Navigation */}

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
      />

    </section>
  );
}