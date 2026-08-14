import FormInput from "./FormInput";
import NavigationButtons from "./NavigationButtons";

type PersonalData = {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
};

type PersonalFormProps = {
  data: PersonalData;
  onChange: (
    field: keyof PersonalData,
    value: string
  ) => void;
  onNext: () => void;
};

export default function PersonalForm({
  data,
  onChange,
  onNext,
}: PersonalFormProps) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8">

      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
          Personal Information
        </h2>

        <p className="mt-2 text-sm sm:text-base text-on-surface-variant">
          Enter your basic contact information.
        </p>
      </div>

      <div className="space-y-5">

        <FormInput
          label="Full Name"
          value={data.name}
          onChange={(value) => onChange("name", value)}
          placeholder="Enter your full name"
        />

        <FormInput
          label="Phone"
          value={data.phone}
          onChange={(value) => onChange("phone", value)}
          placeholder="Enter your phone number"
          type="tel"
        />

        <FormInput
          label="Email"
          value={data.email}
          onChange={(value) => onChange("email", value)}
          placeholder="Enter your email address"
          type="email"
        />

        <FormInput
          label="LinkedIn Username"
          value={data.linkedin}
          onChange={(value) => onChange("linkedin", value)}
          placeholder="Enter your username"
        />

        <FormInput
          label="GitHub Username"
          value={data.github}
          onChange={(value) => onChange("github", value)}
          placeholder="Enter your username"
        />

      </div>

      <NavigationButtons onNext={onNext} />

    </section>
  );
}