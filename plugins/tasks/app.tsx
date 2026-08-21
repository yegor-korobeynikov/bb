import { definePluginApp } from "@get-bb/plugin-sdk/app";
import { TasksAppShell } from "./shell/app-shell.js";
import { TasksSidebarAccessory } from "./shell/sidebar-accessory.js";
import { TasksNavigationPanel } from "./shell/navigation-panel.js";
import { TaskDirectiveCard, TaskEmbedPanel } from "./views/embed/index.js";

export default definePluginApp((app) => {
  app.slots.navPanel({
    id: "tasks",
    title: "Tasks",
    icon: "ListTodo",
    path: "tasks",
    component: TasksAppShell,
    experimental_sidebarAccessory: TasksSidebarAccessory,
    experimental_fixedTabs: [
      {
        panelId: "tasks",
        id: "navigation",
        title: "Navigation",
        icon: "ListView",
        component: TasksNavigationPanel,
        layout: "flush",
      },
    ],
  });
  app.slots.threadPanelAction({
    id: "task",
    title: "Task",
    icon: "ListTodo",
    component: TaskEmbedPanel,
    // TaskEmbedPanel owns its own header + scroll container (its detail body
    // is `min-h-0 flex-1 overflow-y-auto`, sized via the panel's own `h-full`
    // chain). Without `flush`, the host wraps it in a second `overflow-y-auto
    // p-4` box: a long task description/comment thread sits inside two
    // same-size nested auto-scroll containers, and the outer one never has
    // anything to scroll — content renders cut off after the first
    // screenful with no way to reach the rest.
    layout: "flush",
  });
  app.slots.messageDirective({ id: "task", component: TaskDirectiveCard });
});
