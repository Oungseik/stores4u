import Root from "./resizable-sheet.svelte";
import Content from "./resizable-sheet-content.svelte";

export {
  Close as SheetClose,
  Description as SheetDescription,
  Footer as SheetFooter,
  Header as SheetHeader,
  Title as SheetTitle,
  Trigger as SheetTrigger,
} from "../sheet/index.js";
export {
  Content,
  Content as ResizableSheetContent,
  Root,
  //
  Root as ResizableSheet,
};
