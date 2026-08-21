import FormInput from "./FormInput";
import FormTextarea from "./FormTextarea";
import NavigationButtons from "./NavigationButtons";

export type ProjectData = {
  name: string;
  description: string;
  technologies: string;
  projectLink: string;
  githubLink: string;
};

type ProjectsFormProps = {
  data: ProjectData[];
  onChange: (
    index: number,
    field: keyof ProjectData,
    value: string
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function ProjectsForm({
  data,
  onChange,
  onAdd,
  onRemove,
  onBack,
  onNext,
}: ProjectsFormProps) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8">

      {/* Header */}

      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
          Projects
        </h2>

        <p className="mt-2 text-sm sm:text-base text-on-surface-variant">
          Add projects that demonstrate your skills and experience.
        </p>
      </div>

      {/* Projects */}

      <div className="space-y-8">

        {data.map((project, index) => (

          <div
            key={index}
            className="border border-outline-variant rounded-2xl p-5 sm:p-6"
          >

            {/* Project Header */}

            <div className="flex items-center justify-between mb-6">

              <h3 className="text-lg font-bold text-on-surface">
                Project {index + 1}
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

            {/* Fields */}

            <div className="space-y-5">

              <FormInput
                label="Project Name"
                value={project.name}
                onChange={(value) =>
                  onChange(index, "name", value)
                }
                placeholder="Enter project name"
              />

              <FormTextarea
                label="Project Description"
                value={project.description}
                onChange={(value) =>
                  onChange(index, "description", value)
                }
                placeholder="Describe what you built, the problem it solves, and your contribution"
                rows={6}
              />

              <FormInput
                label="Technologies"
                value={project.technologies}
                onChange={(value) =>
                  onChange(index, "technologies", value)
                }
                placeholder="Example: React, Node.js, PostgreSQL"
              />

              <FormInput
                label="Project Link"
                value={project.projectLink}
                onChange={(value) =>
                  onChange(index, "projectLink", value)
                }
                placeholder="Enter project URL"
                type="url"
              />

              <FormInput
                label="GitHub Repository"
                value={project.githubLink}
                onChange={(value) =>
                  onChange(index, "githubLink", value)
                }
                placeholder="Enter GitHub repository URL"
                type="url"
              />

            </div>

          </div>

        ))}

      </div>

      {/* Add Project */}

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
        + Add Another Project
      </button>

      {/* Navigation */}

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
      />

    </section>
  );
}