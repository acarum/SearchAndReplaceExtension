import { IComponent, getStudioProApi } from "@mendix/extensions-api";
import { ComponentContext, DocumentContext, Menu } from "@mendix/extensions-api";

export const component: IComponent = {
    async loaded(componentContext) {
        const studioPro = getStudioProApi(componentContext);


        await studioPro.ui.extensionsMenu.add({
            menuId: "TestExtension.menu",
            caption: "My Menu",
            subMenus: [{
                menuId: "TestExtension.ShowMenu",
                caption: "Show tab",
                action: async () => {
                    await studioPro.ui.tabs.open(
                        {
                            title: "TestExtension tab"
                        },
                        {
                            componentName: "extension/TestExtension",
                            uiEntrypoint: "tab"
                        }
                    )
                }
            }]
        });
    }
}


