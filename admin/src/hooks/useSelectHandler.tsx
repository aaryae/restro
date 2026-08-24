import CustomDialog from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import { ReactNode, useEffect, useState } from "react";
import { Plus } from "lucide-react";

interface OptionType {
  label: string;
  value: string;
}

interface UseSelectHandlerProps {
  fetchOptions: () => Promise<OptionType[]>;
  label?: string;
  DialogContent: (props: { closeModal: () => void }) => ReactNode;
  DrawerContent: (props: { id: string | null }) => ReactNode;
}

export default function useSelectHandler({
  fetchOptions,
  label = "Select Options",
  DialogContent,
  DrawerContent,
}: UseSelectHandlerProps) {
  const [options, setOptions] = useState<OptionType[]>([]);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadOptions = async () => {
      const data = await fetchOptions();
      setOptions(data);
    };
    loadOptions();
  }, [fetchOptions]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedValue(event.target.value);
  };

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const handleDrawerOpen = (
    event: React.MouseEvent,
    selectedId: string | null,
  ) => {
    event.preventDefault();
    setSelectedValue(selectedId);
    setIsDrawerOpen(true);
  };

  const DialogComponent = (
    <CustomDialog
      buttonTitle={
        <button className="flex items-center gap-[0.25rem] text-primaryColor">
          <Plus /> Create
        </button>
      }
      title={`Add ${label}`}
      dialogOpen={dialogOpen}
      setDialogOpen={setDialogOpen}
    >
      {DialogContent({ closeModal: handleCloseDialog })}
    </CustomDialog>
  );

  const DrawerComponent = (
    <Drawer
      isOpen={isDrawerOpen}
      setIsOpen={setIsDrawerOpen}
      width="w-full lg:w-[30%]"
    >
      {DrawerContent({ id: selectedValue })}
    </Drawer>
  );

  return {
    options,
    selectedValue,
    handleChange,
    handleOpenDialog,
    handleDrawerOpen,
    DialogComponent,
    DrawerComponent,
  };
}
