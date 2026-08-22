import FormInput from "./FormInput";
import NavigationButtons from "./NavigationButtons";

export type CertificationData = {
  name: string;
  organization: string;
  issueDate: string;
  credentialId: string;
  credentialUrl: string;
};

type CertificationsFormProps = {
  data: CertificationData[];
  onChange: (
    index: number,
    field: keyof CertificationData,
    value: string
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function CertificationsForm({
  data,
  onChange,
  onAdd,
  onRemove,
  onBack,
  onNext,
}: CertificationsFormProps) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8">

      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
          Certifications
        </h2>

        <p className="mt-2 text-sm sm:text-base text-on-surface-variant">
          Add your professional certifications and credentials.
        </p>
      </div>

      <div className="space-y-8">

        {data.map((certification, index) => (
          <div
            key={index}
            className="border border-outline-variant rounded-2xl p-5 sm:p-6"
          >

            <div className="flex items-center justify-between mb-6">

              <h3 className="text-lg font-bold text-on-surface">
                Certification {index + 1}
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
                label="Certification Name"
                value={certification.name}
                onChange={(value) =>
                  onChange(index, "name", value)
                }
                placeholder="Enter certification name"
              />

              <FormInput
                label="Issuing Organization"
                value={certification.organization}
                onChange={(value) =>
                  onChange(index, "organization", value)
                }
                placeholder="Enter issuing organization"
              />

              <FormInput
                label="Issue Date"
                value={certification.issueDate}
                onChange={(value) =>
                  onChange(index, "issueDate", value)
                }
                placeholder="Enter issue date"
              />

              <FormInput
                label="Credential ID"
                value={certification.credentialId}
                onChange={(value) =>
                  onChange(index, "credentialId", value)
                }
                placeholder="Enter credential ID"
              />

              <FormInput
                label="Credential URL"
                value={certification.credentialUrl}
                onChange={(value) =>
                  onChange(index, "credentialUrl", value)
                }
                placeholder="Enter credential URL"
                type="url"
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
        + Add Another Certification
      </button>

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
      />

    </section>
  );
}