import { getStudioProApi } from "@mendix/extensions-api";

class Main {
    async loaded(componentContext) {
        const studioPro = getStudioProApi(componentContext);

        await studioPro.ui.extensionsMenu.add({
            menuId: "TestExtension.MainMenu",
            caption: "FindAndReplace",
            subMenus: [
                { menuId: "TestExtension.ShowMenu", caption: "Show tab"}
            ],
        });

        // Open a tab when the menu item is clicked
        studioPro.ui.extensionsMenu.addEventListener(
            "menuItemActivated",
            (args) => {
                if (args.menuId === "TestExtension.ShowMenu") {
                    studioPro.ui.tabs.open(
                        {
                            title: "Find and Replace",
                        },
                        {
                            componentName: "extension/TestExtension", 
                            uiEntrypoint: "tab"
                        }
                    )
                }
            }
        )
    }
}

export const component = new Main();
