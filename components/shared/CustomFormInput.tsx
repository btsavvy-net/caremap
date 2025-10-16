import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { AlertCircleIcon } from "@/components/ui/icon";

type FormInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  isDisabled?: boolean;
  isRequired?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export function CustomFormInput({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "none",
  isDisabled = false,
  isRequired = false,
  size = "xl",
  className,
}: FormInputProps) {
  return (
    <FormControl
      className={className || "mb-4"}
      isInvalid={!!error}
      isDisabled={isDisabled}
      isRequired={isRequired}
    >
      <FormControlLabel>
        <FormControlLabelText className=" font-normal">{label}</FormControlLabelText>
      </FormControlLabel>

      <Input className="bg-white rounded-lg" size={size} variant="outline">
        <InputField
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholder={placeholder}
          style={{ fontSize: 16 }}
        />
      </Input>

      {error && (
        <FormControlError>
          <FormControlErrorIcon as={AlertCircleIcon} />
          <FormControlErrorText>{error}</FormControlErrorText>
        </FormControlError>
      )}
    </FormControl>
  );
}
