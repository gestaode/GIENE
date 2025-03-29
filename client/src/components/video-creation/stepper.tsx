import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: string;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };
  
  const isStepComplete = (stepId: string) => {
    const currentIndex = getCurrentStepIndex();
    const stepIndex = steps.findIndex(step => step.id === stepId);
    return stepIndex < currentIndex;
  };
  
  const isCurrentStep = (stepId: string) => {
    return stepId === currentStep;
  };
  
  return (
    <div className="flex items-center w-full mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex-1 relative">
          <div className="flex items-center">
            <div 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-medium z-10 relative",
                isStepComplete(step.id) && "bg-primary-600 text-white",
                isCurrentStep(step.id) && "bg-primary-600 text-white",
                !isStepComplete(step.id) && !isCurrentStep(step.id) && "bg-gray-200 text-gray-600"
              )}
            >
              {isStepComplete(step.id) ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  "h-1 absolute top-4 left-0 w-full",
                  isStepComplete(step.id) ? "bg-primary-600" : "bg-gray-200"
                )}
              />
            )}
          </div>
          <p 
            className={cn(
              "text-xs mt-2 font-medium",
              isStepComplete(step.id) && "text-primary-600",
              isCurrentStep(step.id) && "text-primary-600",
              !isStepComplete(step.id) && !isCurrentStep(step.id) && "text-gray-500"
            )}
          >
            {step.label}
          </p>
        </div>
      ))}
    </div>
  );
}
