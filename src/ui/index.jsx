import React, { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { getStudioProApi } from "@mendix/extensions-api";

const styles = {
    page: {
        minHeight: "100vh",
        padding: "2rem",
        boxSizing: "border-box",
        margin: 0,
        backgroundColor: "#1b1d23",
        color: "#f4f6fb",
        fontFamily: "Segoe UI, sans-serif",
    },

    panel: {
        maxWidth: "900px",
        margin: "0 auto",
        backgroundColor: "#262a33",
        borderRadius: "12px",
        padding: "2.25rem",
        boxShadow: "0 18px 40px rgba(0, 0, 0, 0.35)",
    },

    helper: {
        color: "#c2c7d4",
        marginTop: "0.5rem",
        lineHeight: 1.5,
    },

    formRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "0.75rem",
        marginTop: "1.5rem",
    },

    input: {
        flex: "1 1 280px",
        minWidth: "240px",
        padding: "0.65rem 0.75rem",
        borderRadius: "10px",
        border: "1px solid #404654",
        backgroundColor: "#1f232d",
        color: "#f4f6fb",
    },

    button: {
        padding: "0.65rem 1.35rem",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer",
        background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
        color: "#ffffff",
        fontWeight: 600,
        letterSpacing: "0.3px",
    },

    resultsSection: {
        marginTop: "2rem",
        backgroundColor: "#1f232d",
        borderRadius: "10px",
        padding: "1.35rem",
        border: "1px solid #2f3544",
    },

    resultItem: {
        padding: "0.9rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
    },

    resultTitle: {
        fontWeight: 600,
        fontSize: "1.05rem",
    },

    subTitle: {
        color: "#b9bfd1",
        marginTop: "0.25rem",
        fontSize: "0.9rem",
    },

    badge: {
        display: "inline-block",
        fontSize: "0.75rem",
        padding: "0.15rem 0.55rem",
        borderRadius: "999px",
        backgroundColor: "#353b4b",
        color: "#b9bfd1",
        marginLeft: "0.75rem",
    },

    metaList: {
        color: "#949bb0",
        fontSize: "0.85rem",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "0.35rem",
        marginTop: "0.75rem",
    },

    metaItem: {
        padding: "0.4rem 0.6rem",
        borderRadius: "6px",
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
    },

    matchList: {
        marginTop: "0.9rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
    },

    matchItem: {
        padding: "0.65rem 0.75rem",
        borderRadius: "8px",
        backgroundColor: "rgba(79, 70, 229, 0.12)",
        border: "1px solid rgba(79, 70, 229, 0.35)",
        color: "#d9dcf7",
        fontSize: "0.85rem",
        lineHeight: 1.5,
    },

    matchHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        marginBottom: "0.45rem",
    },

    matchButton: {
        padding: "0.35rem 0.9rem",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        backgroundColor: "#4f46e5",
        color: "#ffffff",
        fontWeight: 600,
        fontSize: "0.8rem",
        letterSpacing: "0.2px",
    },

    matchButtonSuccess: {
        backgroundColor: "#16a34a",
        border: "none",
        color: "#ffffff",
    },

    resultHeader: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
    },

    openDocumentButton: {
        padding: "0.45rem 1rem",
        borderRadius: "8px",
        border: "1px solid rgba(148,155,176,0.3)",
        backgroundColor: "transparent",
        color: "#d0d4e4",
        fontWeight: 600,
        fontSize: "0.8rem",
        cursor: "pointer",
    },

    replaceStatus: {
        marginTop: "0.45rem",
        fontSize: "0.8rem",
        lineHeight: 1.4,
    },

    replaceStatusSuccess: {
        color: "#5eead4",
    },

    replaceStatusError: {
        color: "#fca5a5",
    },

    errorBox: {
        marginTop: "1rem",
        padding: "0.8rem 1rem",
        borderRadius: "8px",
        backgroundColor: "#3f1f24",
        color: "#fbb6c1",
        border: "1px solid #a8324a",
    },
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isNonEmptyString = (value) =>
    typeof value === "string" && value.trim().length > 0;

const formatActionKindLabel = (typeName) => {
    if (!isNonEmptyString(typeName)) {
        return "Element";
    }

    const withoutNamespace = typeName.includes("$")
        ? typeName.substring(typeName.indexOf("$") + 1)
        : typeName;
    const withSpacing = withoutNamespace.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    const withoutSuffix = withSpacing
        .replace(/\b(Action|Element)$/i, "")
        .trim();
    return withoutSuffix || withSpacing || "Element";
};

const formatPropertyLabel = (propertyName) => {
    if (!isNonEmptyString(propertyName)) {
        return "Name";
    }
    return propertyName
        .replace(/^\$+/, "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\bId\b/gi, "ID")
        .trim();
};

const isNameLikeProperty = (propertyName) => {
    if (!isNonEmptyString(propertyName)) {
        return false;
    }
    if (propertyName.startsWith("$")) {
        return false;
    }

    const lower = propertyName.toLowerCase();
    const nameLikeTerms = [
        "name",
        "caption",
        "title",
        "label",
        "text",
        "display",
    ];
    return nameLikeTerms.some((term) => lower.includes(term));
};

const classifyMatch = (elementType, propertyName, actionLabel) => {
    const propertyLabel = formatPropertyLabel(propertyName);
    const baseLabel = actionLabel || formatActionKindLabel(elementType);
    if (
        elementType === "Microflows$CreateVariableAction" &&
        propertyName === "variableName"
    ) {
        return {
            kind: "create-variable",
            label: "element",
            variableType: "Variable",
        };
    }
    if (
        elementType === "Microflows$MicroflowParameter" &&
        propertyName === "name"
    ) {
        return {
            kind: "parameter",
            label: "Parameter",
            variableType: "Parameter",
        };
    }
    if (propertyName === "outputVariableName") {
        return {
            kind: "action-output",
            label: `${baseLabel} result`.trim(),
            variableType: "Output variable",
        };
    }
    if (propertyName === "mappingArgumentVariableName") {
        return {
            kind: "action-property",
            label: `${baseLabel} mapping variable`.trim(),
            variableType: "Mapping variable",
        };
    }
    return {
        kind: "property",
        label: `${baseLabel} ${propertyLabel}`.trim(),
        variableType: propertyLabel,
    };
};

const deriveNodeLabel = (node, fallback, propertyName) => {
    if (node && typeof node === "object") {
        const candidateKeys = ["caption", "label", "title", "name"];
        for (const key of candidateKeys) {
            if (typeof node[key] === "string") {
                const trimmed = node[key].trim();
                if (trimmed) {
                    return trimmed;
                }
            }
        }
        if (typeof node.$Type === "string" && node.$Type) {
            const typeLabel = formatActionKindLabel(node.$Type);
            if (typeLabel) {
                return typeLabel;
            }
        }
    }
    if (isNonEmptyString(fallback)) {
        return fallback;
    }
    if (propertyName) {
        return formatPropertyLabel(propertyName);
    }
    return "";
};

const appendToPath = (path, ...segments) => {
    const next = Array.isArray(path) ? [...path] : [];
    for (const segment of segments) {
        if (!isNonEmptyString(segment)) {
            continue;
        }
        if (next[next.length - 1] === segment) {
            continue;
        }
        next.push(segment);
    }
    return next;
};

const collectMatchesFromUnit = ({
    unit,
    searchTermLower,
    unitInfo,
    componentLabel,
    modelKey,
}) => {
    if (!unit || typeof unit !== "object") {
        return [];
    }

    const matches = [];
    const unitIdValue =
        (typeof unit.$ID === "string" && unit.$ID) ||
        (unitInfo && typeof unitInfo.$ID === "string" ? unitInfo.$ID : "");
    const defaultModelKey =
        typeof modelKey === "string" && modelKey ? modelKey : undefined;
    const unitLabel = deriveNodeLabel(unit, unitInfo?.name ?? "", "");
    const initialPathSegments = [];
    if (isNonEmptyString(componentLabel)) {
        initialPathSegments.push(componentLabel);
    }
    if (isNonEmptyString(unitInfo?.moduleName)) {
        initialPathSegments.push(unitInfo.moduleName);
    }
    if (isNonEmptyString(unitLabel)) {
        initialPathSegments.push(unitLabel);
    }

    const initialPath = initialPathSegments.length
        ? initialPathSegments
        : [componentLabel || "Document"];
    const stack = [
        {
            node: unit,
            elementId:
                typeof unit.$ID === "string" ? unit.$ID : unitInfo?.$ID ?? "",
            elementType: unit.$Type ?? unitInfo?.$Type ?? "",
            displayLabel: unitLabel || componentLabel || "Document",
            path: initialPath,
        },
    ];
    const visitedIds = new Set();
    const visitedObjects = new WeakSet();
    const seenKeys = new Set();
    while (stack.length) {
        const current = stack.pop();
        if (!current || typeof current.node !== "object") {
            continue;
        }

        const { node } = current;
        let { elementId, elementType } = current;
        let displayLabel = current.displayLabel;
        let path = Array.isArray(current.path) ? [...current.path] : [];
        if (typeof node.$ID === "string") {
            if (visitedIds.has(node.$ID)) {
                continue;
            }
            visitedIds.add(node.$ID);
            elementId = node.$ID;
        } else if (visitedObjects.has(node)) {
            continue;
        } else {
            visitedObjects.add(node);
        }
        if (typeof node.$Type === "string") {
            elementType = node.$Type;
        }

        const derivedLabel = deriveNodeLabel(node, displayLabel, "");
        if (isNonEmptyString(derivedLabel)) {
            displayLabel = derivedLabel;
            path = appendToPath(path, derivedLabel);
        }
        for (const [key, value] of Object.entries(node)) {
            if (key.startsWith("$") || value === undefined || value === null) {
                continue;
            }
            if (typeof value === "string") {
                const trimmed = value.trim();
                if (!trimmed) {
                    continue;
                }
                if (!trimmed.toLowerCase().includes(searchTermLower)) {
                    continue;
                }
                if (!isNameLikeProperty(key)) {
                    continue;
                }

                const ownerId =
                    typeof node.$ID === "string" ? node.$ID : elementId;
                if (!ownerId) {
                    continue;
                }

                const matchKey = `${ownerId}::${key}`;
                if (seenKeys.has(matchKey)) {
                    continue;
                }
                seenKeys.add(matchKey);
                const propertyLabel = formatPropertyLabel(key);
                const classification = classifyMatch(
                    elementType,
                    key,
                    displayLabel
                );
                const variableTypeValue =
                    (node?.variableType &&
                    typeof node.variableType === "object" &&
                    typeof node.variableType.$Type === "string"
                        ? node.variableType.$Type
                        : typeof node?.variableType === "string"
                        ? node.variableType
                        : classification.variableType) ??
                    classification.variableType;
                const initialValueValue =
                    typeof node?.initialValue === "string"
                        ? node.initialValue
                        : classification.initialValue ?? "";
                const isUnitRootProperty =
                    ownerId && unitIdValue && ownerId === unitIdValue;
                const matchModelKey =
                    isUnitRootProperty && key === "name"
                        ? "projects"
                        : defaultModelKey;
                matches.push({
                    value: trimmed,
                    variableName: trimmed,
                    caption: displayLabel || classification.label,
                    propertyName: key,
                    propertyLabel,
                    targetId: ownerId,
                    elementId: ownerId,
                    elementType,
                    kind: classification.kind,
                    kindLabel: classification.label,
                    variableType: variableTypeValue,
                    initialValue: initialValueValue,
                    contextLabel: path.length
                        ? path[path.length - 1]
                        : displayLabel || classification.label,
                    contextPath: [...path],
                    pathDisplay: path.length
                        ? path.join(
                              " ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âº "
                          )
                        : "",
                    modelKey: matchModelKey,
                });
                continue;
            }
            if (Array.isArray(value)) {
                const propertyLabel = formatPropertyLabel(key);
                for (const item of value) {
                    if (!item || typeof item !== "object") {
                        continue;
                    }

                    const itemLabel = deriveNodeLabel(item, propertyLabel, key);
                    const nextPath = appendToPath(
                        path,
                        propertyLabel,
                        itemLabel
                    );
                    stack.push({
                        node: item,
                        elementId:
                            typeof item.$ID === "string" ? item.$ID : elementId,
                        elementType: item.$Type ?? elementType,
                        displayLabel: itemLabel,
                        path: nextPath,
                    });
                }
                continue;
            }
            if (value && typeof value === "object") {
                const propertyLabel = formatPropertyLabel(key);
                const objectLabel = deriveNodeLabel(value, propertyLabel, key);
                const nextPath = appendToPath(path, propertyLabel, objectLabel);
                stack.push({
                    node: value,
                    elementId:
                        typeof value.$ID === "string" ? value.$ID : elementId,
                    elementType: value.$Type ?? elementType,
                    displayLabel: objectLabel,
                    path: nextPath,
                });
            }
        }
    }
    return matches;
};

const createMatchKey = (componentKey, targetId, fallback = "") => {
    const normalizedComponent =
        typeof componentKey === "string" ? componentKey.trim() : "";
    const normalizedTarget =
        typeof targetId === "string"
            ? targetId
            : targetId !== undefined && targetId !== null
            ? String(targetId)
            : "";
    if (normalizedComponent && normalizedTarget) {
        return `${normalizedComponent}::${normalizedTarget}`;
    }
    if (normalizedTarget) {
        return normalizedTarget;
    }
    return fallback;
};

const MODEL_COMPONENTS = [
    {
        componentKey: "microflows",
        modelKey: "microflows",
        label: "Microflow",
        typePrefixes: ["Microflows$"],
    },
    {
        componentKey: "pages",
        modelKey: "pages",
        label: "Page",
        typePrefixes: ["Pages$"],
    },
    {
        componentKey: "domainModels",
        modelKey: "domainModels",
        label: "Domain model",
        typePrefixes: ["DomainModels$"],
    },
    {
        componentKey: "enumerations",
        modelKey: "enumerations",
        label: "Enumeration",
        typePrefixes: ["Enumerations$"],
    },
    {
        componentKey: "snippets",
        modelKey: "snippets",
        label: "Snippet",
        typePrefixes: ["Pages$Snippet"],
    },
    {
        componentKey: "buildingBlocks",
        modelKey: "buildingBlocks",
        label: "Building block",
        typePrefixes: ["Pages$BuildingBlock"],
    },
    {
        componentKey: "moduleSettings",
        modelKey: "moduleSettings",
        label: "Module settings",
        typePrefixes: ["Projects$ModuleSettings"],
    },
];

const ADDITIONAL_DOCUMENT_TYPES = [
    {
        componentKey: "nanoflows",
        modelKey: "projects",
        label: "Nanoflow",
        typePrefixes: ["Nanoflows$"],
    },
    {
        componentKey: "javaActions",
        modelKey: "projects",
        label: "Java action",
        typePrefixes: ["JavaActions$"],
    },
    {
        componentKey: "importMappings",
        modelKey: "projects",
        label: "Import mapping",
        typePrefixes: ["Mappings$ImportMapping"],
    },
    {
        componentKey: "exportMappings",
        modelKey: "projects",
        label: "Export mapping",
        typePrefixes: ["Mappings$ExportMapping"],
    },
    {
        componentKey: "messageDefinitions",
        modelKey: "projects",
        label: "Message definition",
        typePrefixes: ["Mappings$MessageDefinition"],
    },
    {
        componentKey: "xmlSchemas",
        modelKey: "projects",
        label: "XML schema",
        typePrefixes: ["XmlSchemas$"],
    },
    {
        componentKey: "jsonStructures",
        modelKey: "projects",
        label: "JSON structure",
        typePrefixes: ["JsonStructures$"],
    },
    {
        componentKey: "documentTemplates",
        modelKey: "projects",
        label: "Document template",
        typePrefixes: ["DocumentTemplates$"],
    },
    {
        componentKey: "rules",
        modelKey: "projects",
        label: "Rule",
        typePrefixes: ["Rules$"],
    },
    {
        componentKey: "constants",
        modelKey: "projects",
        label: "Constant",
        typePrefixes: ["Constants$"],
    },
    {
        componentKey: "javaScriptActions",
        modelKey: "projects",
        label: "JavaScript action",
        typePrefixes: ["JavaScriptActions$"],
    },
    {
        componentKey: "workflows",
        modelKey: "projects",
        label: "Workflow",
        typePrefixes: ["Workflows$"],
    },
    {
        componentKey: "restServices",
        modelKey: "projects",
        label: "REST service",
        typePrefixes: ["RestServices$"],
    },
    {
        componentKey: "odataServices",
        modelKey: "projects",
        label: "OData service",
        typePrefixes: ["DataServices$"],
    },
    {
        componentKey: "publishedServices",
        modelKey: "projects",
        label: "Published service",
        typePrefixes: ["PublishedServices$"],
    },
    {
        componentKey: "scheduledEvents",
        modelKey: "projects",
        label: "Scheduled event",
        typePrefixes: ["ScheduledEvents$"],
    },
    {
        componentKey: "tasks",
        modelKey: "projects",
        label: "Task",
        typePrefixes: ["Tasks$"],
    },
    {
        componentKey: "microflowRules",
        modelKey: "projects",
        label: "Microflow rule",
        typePrefixes: ["Microflows$Rule"],
    },
];

const DOCUMENT_TYPE_MAPPINGS = [
    ...MODEL_COMPONENTS,
    ...ADDITIONAL_DOCUMENT_TYPES,
];

const chunkArray = (items, size) => {
    if (!Array.isArray(items) || size <= 0) {
        return [];
    }

    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
};

const resolveDocumentDescriptor = (unitType) => {
    if (typeof unitType !== "string" || !unitType) {
        return null;
    }
    for (const descriptor of DOCUMENT_TYPE_MAPPINGS) {
        if (!descriptor || !Array.isArray(descriptor.typePrefixes)) {
            continue;
        }
        if (
            descriptor.typePrefixes.some((prefix) =>
                unitType.startsWith(prefix)
            )
        ) {
            return descriptor;
        }
    }

    const sanitizedKey = unitType.replace(/[^a-z0-9$]+/gi, "-");
    return {
        componentKey: `projects:${sanitizedKey}`.toLowerCase(),
        modelKey: "projects",
        label: formatActionKindLabel(unitType),
        typePrefixes: [unitType],
    };
};

function App({
    canSearch,
    canOpenDocuments,
    onSearch,
    onReplace,
    onOpenDocument,
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [replaceTerm, setReplaceTerm] = useState("");
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [lastSearchTerm, setLastSearchTerm] = useState("");
    const [replaceStatuses, setReplaceStatuses] = useState({});
    const [activeReplaceId, setActiveReplaceId] = useState(null);
    const [isReplacingAll, setIsReplacingAll] = useState(false);
    const hasResults = results.length > 0;
    const buttonLabel = isSearching ? "Searching..." : "Search";
    const replaceAllLabel = isReplacingAll ? "Replacing..." : "Replace all";
    const handleSubmit = async (event) => {
        event.preventDefault();
        const trimmed = searchTerm.trim();
        if (!onSearch || isSearching) {
            return;
        }
        if (!trimmed) {
            setError("Enter text to search for.");
            setResults([]);
            setHasSearched(false);
            return;
        }
        setIsSearching(true);
        setError(null);
        setReplaceStatuses({});
        setActiveReplaceId(null);
        try {
            const matches = await onSearch(trimmed);
            setResults(matches);
            setHasSearched(true);
            setLastSearchTerm(trimmed);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            setResults([]);
            setHasSearched(true);
            setLastSearchTerm(trimmed);
        } finally {
            setIsSearching(false);
        }
    };

    const handleReplaceClick = async (result, match) => {
        const trimmedSearch = searchTerm.trim();
        const unitId = result?.documentId;
        const componentKey = result?.componentKey || match?.componentKey;
        const modelKey = result?.modelKey || match?.modelKey || componentKey;
        const targetId =
            match?.targetId ||
            match?.elementId ||
            match?.actionElementId ||
            match?.actionId;
        if (
            !onReplace ||
            !trimmedSearch ||
            !targetId ||
            !unitId ||
            !componentKey ||
            !modelKey ||
            isReplacingAll
        ) {
            return;
        }

        const matchKey = createMatchKey(
            componentKey,
            targetId,
            `${unitId}-${componentKey}`
        );
        setActiveReplaceId(matchKey);
        try {
            const payload = [
                {
                    documentId: unitId,
                    componentKey,
                    modelKey,
                    matches: [
                        {
                            ...match,
                            componentKey,
                            modelKey,
                            targetId,
                        },
                    ],
                },
            ];
            const response = await onReplace(
                payload,
                trimmedSearch,
                replaceTerm
            );
            const replacements = Array.isArray(response?.replacements)
                ? response.replacements
                : [];
            if (response?.success && replacements.length) {
                const replacement = replacements[0];
                const replacementTargetId =
                    replacement?.targetId || replacement?.actionId || targetId;
                const replacementKey = createMatchKey(
                    componentKey,
                    replacementTargetId,
                    matchKey
                );
                setReplaceStatuses((previous) => {
                    const next = { ...previous };
                    next[replacementKey] = {
                        status: "success",
                        oldName: replacement?.oldName ?? "",
                        newName: replacement?.newName ?? "",
                        kindLabel:
                            replacement?.kindLabel ?? match?.kindLabel ?? "",
                    };
                    return next;
                });
                setResults((previousResults) =>
                    previousResults.map((item) => {
                        if (
                            item.documentId !== unitId ||
                            item.componentKey !== componentKey ||
                            (item.modelKey && item.modelKey !== modelKey)
                        ) {
                            return item;
                        }
                        return {
                            ...item,
                            modelKey: item.modelKey ?? modelKey,
                            matches: item.matches?.map((existingMatch) => {
                                const existingTargetId =
                                    existingMatch.targetId ||
                                    existingMatch.elementId ||
                                    existingMatch.actionElementId ||
                                    existingMatch.actionId ||
                                    existingMatch.$ID;
                                const existingKey = createMatchKey(
                                    componentKey,
                                    existingTargetId
                                );
                                if (existingKey !== replacementKey) {
                                    return existingMatch;
                                }

                                const updatedValue =
                                    replacement?.newName ??
                                    existingMatch.value ??
                                    existingMatch.variableName;
                                return {
                                    ...existingMatch,
                                    modelKey: modelKey,
                                    targetId: existingTargetId,
                                    elementId: existingTargetId,
                                    value: updatedValue,
                                    variableName: updatedValue,
                                };
                            }),
                        };
                    })
                );
            } else {
                const message =
                    response?.message ||
                    "Could not perform the replace operation.";
                setReplaceStatuses((previous) => ({
                    ...previous,
                    [matchKey]: {
                        status: "error",
                        message,
                    },
                }));
            }
        } catch (replaceError) {
            const message =
                replaceError instanceof Error
                    ? replaceError.message
                    : String(replaceError ?? "Unknown error");
            setReplaceStatuses((previous) => ({
                ...previous,
                [matchKey]: {
                    status: "error",
                    message,
                },
            }));
        } finally {
            setActiveReplaceId(null);
        }
    };

    const handleReplaceAll = async () => {
        const trimmedSearch = searchTerm.trim();
        if (
            !onReplace ||
            !trimmedSearch ||
            !Array.isArray(results) ||
            !results.length ||
            isReplacingAll
        ) {
            return;
        }
        setIsReplacingAll(true);
        setActiveReplaceId(null);
        setError(null);
        try {
            const response = await onReplace(
                results,
                trimmedSearch,
                replaceTerm
            );
            const replacements = Array.isArray(response?.replacements)
                ? response.replacements
                : [];
            if (response?.success && replacements.length) {
                const statusUpdates = {};
                const replacementsByKey = new Map();
                for (const replacement of replacements) {
                    const componentKey =
                        (typeof replacement?.componentKey === "string" &&
                            replacement.componentKey) ||
                        "";
                    const modelKey =
                        (typeof replacement?.modelKey === "string" &&
                            replacement.modelKey) ||
                        componentKey ||
                        "";
                    const targetIdentifier =
                        replacement?.targetId || replacement?.actionId || "";
                    if (!componentKey || !targetIdentifier) {
                        continue;
                    }

                    const key = createMatchKey(componentKey, targetIdentifier);
                    replacementsByKey.set(key, {
                        componentKey,
                        modelKey,
                        targetId: targetIdentifier,
                        newName: replacement?.newName ?? "",
                        oldName: replacement?.oldName ?? "",
                        kindLabel: replacement?.kindLabel ?? "",
                    });
                    statusUpdates[key] = {
                        status: "success",
                        oldName: replacement?.oldName ?? "",
                        newName: replacement?.newName ?? "",
                        kindLabel: replacement?.kindLabel ?? "",
                    };
                }
                setReplaceStatuses((previous) => ({
                    ...previous,
                    ...statusUpdates,
                }));
                setResults((previousResults) =>
                    previousResults.map((item) => {
                        if (!Array.isArray(item.matches)) {
                            return item;
                        }

                        const componentKey = item.componentKey;
                        const modelKey = item.modelKey || componentKey;
                        return {
                            ...item,
                            modelKey,
                            matches: item.matches.map((match, matchIndex) => {
                                const targetIdentifier =
                                    match?.targetId ||
                                    match?.elementId ||
                                    match?.actionElementId ||
                                    match?.actionId;
                                const matchComponentKey =
                                    match?.componentKey || componentKey;
                                const key = createMatchKey(
                                    matchComponentKey,
                                    targetIdentifier,
                                    `${matchComponentKey || "match"}-${
                                        targetIdentifier || matchIndex
                                    }`
                                );
                                const replacementInfo =
                                    replacementsByKey.get(key);
                                if (!replacementInfo) {
                                    return match;
                                }

                                const resolvedTargetId =
                                    targetIdentifier ||
                                    replacementInfo.targetId ||
                                    match?.targetId ||
                                    match?.elementId ||
                                    match?.actionElementId ||
                                    match?.actionId ||
                                    match?.$ID ||
                                    key;
                                const updatedValue =
                                    replacementInfo.newName ??
                                    match.value ??
                                    match.variableName;
                                return {
                                    ...match,
                                    componentKey: matchComponentKey,
                                    modelKey:
                                        replacementInfo.modelKey ||
                                        match.modelKey ||
                                        modelKey,
                                    targetId: resolvedTargetId,
                                    elementId: resolvedTargetId,
                                    value: updatedValue,
                                    variableName: updatedValue,
                                };
                            }),
                        };
                    })
                );
            } else {
                const message =
                    response?.message || "No matches required changes.";
                setError(message);
            }
        } catch (replaceAllError) {
            const message =
                replaceAllError instanceof Error
                    ? replaceAllError.message
                    : String(replaceAllError ?? "Unknown error");
            setError(message);
        } finally {
            setIsReplacingAll(false);
        }
    };

    const renderMatchItem = (result, match, matchIndex) => {
        if (!result || !match) {
            return null;
        }

        const targetId =
            match?.targetId ||
            match?.elementId ||
            match?.actionElementId ||
            match?.actionId;
        const componentKey = match?.componentKey || result.componentKey;
        const modelKey = match?.modelKey || result.modelKey || componentKey;
        const matchKey = createMatchKey(
            componentKey,
            targetId,
            `${result.documentId || "document"}-${matchIndex}`
        );
        if (!matchKey) {
            return null;
        }

        const status = replaceStatuses[matchKey];
        const isProcessing = activeReplaceId === matchKey;
        const isSuccess = status?.status === "success";
        const replaceDisabled =
            isProcessing ||
            !onReplace ||
            !trimmedInput ||
            !targetId ||
            isReplacingAll ||
            isSuccess;
        const matchValue = match?.value || match?.variableName || "(empty)";
        const isMicroflowMatch = componentKey === "microflows";
        const contextSegments = Array.isArray(match?.contextPath)
            ? match.contextPath.filter(
                  (segment) => typeof segment === "string" && segment.trim()
              )
            : [];
        let contextDisplay = match?.pathDisplay || match?.contextLabel || "-";
        if (contextSegments.length) {
            let segments = contextSegments.map((segment) => segment.trim());
            const matchValueLower =
                typeof matchValue === "string"
                    ? matchValue.trim().toLowerCase()
                    : "";
            if (
                matchValueLower &&
                segments.length &&
                segments[segments.length - 1].toLowerCase() === matchValueLower
            ) {
                segments = segments.slice(0, -1);
            }
            if (segments.length) {
                contextDisplay = segments.join(" > ");
            }
        }

        const buttonStyle = {
            ...styles.matchButton,
            ...(isSuccess ? styles.matchButtonSuccess : {}),
            opacity: replaceDisabled && !isSuccess ? 0.65 : 1,
            cursor: replaceDisabled
                ? isSuccess
                    ? "default"
                    : "not-allowed"
                : "pointer",
        };
        return (
            <div key={matchKey} style={styles.matchItem}>
                <div style={styles.matchHeader}>
                    <div>
                        <strong>
                            {match?.kindLabel ||
                                match?.propertyLabel ||
                                "Match"}
                            :
                        </strong>{" "}
                        {matchValue}
                    </div>
                    <button
                        type="button"
                        style={buttonStyle}
                        disabled={replaceDisabled}
                        onClick={() =>
                            handleReplaceClick(result, {
                                ...match,
                                componentKey,
                                modelKey,
                            })
                        }
                    >
                        {isProcessing
                            ? "Replacing..."
                            : isSuccess
                            ? "Replaced"
                            : "Replace"}
                    </button>
                </div>
                <div>
                    <strong>Context:</strong> {contextDisplay || "-"}
                </div>
                {!isMicroflowMatch ? (
                    <div>
                        <strong>Element type:</strong>{" "}
                        {formatActionKindLabel(match?.elementType) || "Unknown"}
                    </div>
                ) : null}
                {match?.variableType ? (
                    <div>
                        <strong>Value type:</strong> {match.variableType}
                    </div>
                ) : null}
                {status ? (
                    <div
                        style={{
                            ...styles.replaceStatus,
                            ...(status.status === "success"
                                ? styles.replaceStatusSuccess
                                : styles.replaceStatusError),
                        }}
                    >
                        {status.status === "success" ? (
                            <>
                                {status.kindLabel
                                    ? `${status.kindLabel}: `
                                    : ""}
                                Updated from{" "}
                                <code>{status.oldName ?? "(empty)"}</code> to{" "}
                                <code>{status.newName ?? "(empty)"}</code>.
                            </>
                        ) : (
                            status.message || "Replace failed."
                        )}
                    </div>
                ) : null}
            </div>
        );
    };

    const handleOpenDocument = async (result) => {
        if (!result || !onOpenDocument || !canOpenDocuments) {
            return;
        }
        try {
            await onOpenDocument(result);
            setError(null);
        } catch (openError) {
            const message =
                openError instanceof Error
                    ? openError.message
                    : String(openError ?? "Failed to open document.");
            setError(message);
        }
    };

    const summary = useMemo(() => {
        if (isSearching) {
            return `Searching for "${searchTerm.trim()}"...`;
        }
        if (!hasSearched) {
            return "Enter text and press search to locate matching properties across your documents.";
        }
        if (!hasResults) {
            return `No documents contained a matching property for "${lastSearchTerm}".`;
        }
        return `Found ${results.length} document${
            results.length === 1 ? "" : "s"
        } containing "${lastSearchTerm}".`;
    }, [
        isSearching,
        hasSearched,
        hasResults,
        results.length,
        lastSearchTerm,
        searchTerm,
    ]);

    const trimmedInput = searchTerm.trim();
    const searchDisabled =
        !canSearch || isSearching || !trimmedInput || isReplacingAll;
    const replaceAllDisabled =
        !canSearch ||
        isSearching ||
        isReplacingAll ||
        !trimmedInput ||
        !hasResults ||
        !onReplace;
    return (
        <div style={styles.page}>
            <div style={styles.panel}>
                <h1 style={{ margin: 0 }}>Find and replace extension</h1>
                <p style={styles.helper}>
                    Provide the text you want to locate. We'll list the
                    documents that contain a matching property so you can review
                    and update them quickly.
                </p>
                <form style={styles.formRow} onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Enter text to search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        style={styles.input}
                        disabled={!canSearch || isSearching}
                    />
                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            opacity: searchDisabled ? 0.65 : 1,
                            cursor: searchDisabled ? "not-allowed" : "pointer",
                        }}
                        disabled={searchDisabled}
                    >
                        {buttonLabel}
                    </button>
                    <input
                        type="text"
                        placeholder="Enter replacement value"
                        value={replaceTerm}
                        onChange={(event) => setReplaceTerm(event.target.value)}
                        style={{ ...styles.input, flex: "1 1 280px" }}
                        disabled={!canSearch || isSearching || isReplacingAll}
                    />
                    <button
                        type="button"
                        style={{
                            ...styles.button,
                            opacity: replaceAllDisabled ? 0.65 : 1,
                            cursor: replaceAllDisabled
                                ? "not-allowed"
                                : "pointer",
                            flex: "0 0 auto",
                        }}
                        disabled={replaceAllDisabled}
                        onClick={handleReplaceAll}
                    >
                        {replaceAllLabel}
                    </button>
                </form>
                <div
                    style={{
                        marginTop: "1.25rem",
                        color: "#9aa2b5",
                        fontSize: "0.9rem",
                    }}
                >
                    {summary}
                </div>
                {error ? <div style={styles.errorBox}>{error}</div> : null}
                {hasResults ? (
                    <div style={styles.resultsSection}>
                        {results.map((result, index) => {
                            const matchesForResult = Array.isArray(
                                result.matches
                            )
                                ? result.matches
                                : [];
                            const resultKey =
                                result.documentId ||
                                result.qualifiedName ||
                                result.displayName ||
                                `document-${index}`;
                            const titleName =
                                result.documentName ||
                                result.name ||
                                (result.displayName &&
                                result.displayName !== result.documentName
                                    ? result.displayName
                                    : undefined) ||
                                result.qualifiedName ||
                                result.documentType ||
                                "(unnamed)";
                            const openDisabled =
                                !result?.documentId ||
                                !onOpenDocument ||
                                !canOpenDocuments;
                            return (
                                <div
                                    key={`${resultKey}-${index}`}
                                    style={styles.resultItem}
                                >
                                    <div style={styles.resultHeader}>
                                        <div style={styles.resultTitle}>
                                            {titleName}
                                            {result.moduleName ? (
                                                <span style={styles.badge}>
                                                    {result.moduleName}
                                                </span>
                                            ) : null}{" "}
                                        </div>
                                        <button
                                            type="button"
                                            style={{
                                                ...styles.openDocumentButton,
                                                opacity: openDisabled ? 0.6 : 1,
                                                cursor: openDisabled
                                                    ? "not-allowed"
                                                    : "pointer",
                                            }}
                                            disabled={openDisabled}
                                            onClick={() =>
                                                handleOpenDocument(result)
                                            }
                                        >
                                            Open document
                                        </button>
                                    </div>
                                    <div style={styles.metaList}>
                                        <div style={styles.metaItem}>
                                            <strong>Document type:</strong>{" "}
                                            {result.documentType || "Unknown"}
                                        </div>
                                        <div style={styles.metaItem}>
                                            <strong>Matches found:</strong>{" "}
                                            {matchesForResult.length}
                                        </div>
                                    </div>
                                    {matchesForResult.length ? (
                                        <div style={styles.matchList}>
                                            {matchesForResult.map(
                                                (match, matchIndex) =>
                                                    renderMatchItem(
                                                        result,
                                                        match,
                                                        matchIndex
                                                    )
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

class TabComponent {
    constructor() {
        this.root = null;
        this.studioPro = null;
        this.canOpenDocuments = false;
    }
    ensureRoot() {
        if (!this.root) {
            const host = document.getElementById("root");
            this.root = createRoot(host);
        }
    }
    async loaded(componentContext) {
        this.studioPro = getStudioProApi(componentContext);
        this.canOpenDocuments =
            Boolean(this.studioPro?.ui?.editors) &&
            typeof this.studioPro.ui.editors?.editDocument === "function";
        this.ensureRoot();
        this.root.render(
            <StrictMode>
                <App
                    onSearch={(term) => this.searchDocuments(term)}
                    onReplace={(matches, search, replace) =>
                        this.performReplace(matches, search, replace)
                    }
                    onOpenDocument={(result) => this.openDocument(result)}
                    canSearch={Boolean(this.studioPro)}
                    canOpenDocuments={this.canOpenDocuments}
                />
            </StrictMode>
        );
    }
    async searchDocuments(rawTerm) {
        if (!this.studioPro) {
            throw new Error("Studio Pro API is not available yet.");
        }

        const searchTermLower = rawTerm.trim().toLowerCase();
        if (!searchTermLower) {
            return [];
        }

        const aggregatedResults = new Map();
        const appendResults = (entries) => {
            if (!Array.isArray(entries)) {
                return;
            }
            for (const result of entries) {
                if (!result || !result.documentId) {
                    continue;
                }

                const key = `${
                    result.componentKey || result.modelKey || "doc"
                }::${result.documentId}`;
                aggregatedResults.set(key, result);
            }
        };

        const projectsApi = this.studioPro.app.model?.projects;
        if (this.canTraverseProject(projectsApi)) {
            try {
                const projectResults = await this.searchDocumentsAcrossProject(
                    searchTermLower,
                    projectsApi
                );
                appendResults(projectResults);
            } catch (error) {
                if (
                    typeof console !== "undefined" &&
                    typeof console.warn === "function"
                ) {
                    console.warn(
                        "[searchDocuments] Project traversal failed:",
                        error
                    );
                }
            }
        }
        try {
            const componentResults = await this.searchDocumentsViaComponents(
                searchTermLower
            );
            appendResults(componentResults);
        } catch (componentError) {
            if (
                typeof console !== "undefined" &&
                typeof console.warn === "function"
            ) {
                console.warn(
                    "[searchDocuments] Component traversal failed:",
                    componentError
                );
            }
        }
        return Array.from(aggregatedResults.values());
    }
    canTraverseProject(projectsApi) {
        return Boolean(
            projectsApi &&
                typeof projectsApi.getModules === "function" &&
                typeof projectsApi.getFolders === "function" &&
                typeof projectsApi.getDocumentsInfo === "function" &&
                typeof projectsApi.loadUnits === "function"
        );
    }
    resolveModelAccess(modelKey) {
        const resolvedKey =
            typeof modelKey === "string" && modelKey ? modelKey : "projects";
        const modelApis = this.studioPro?.app?.model ?? {};
        const access =
            resolvedKey === "projects"
                ? modelApis.projects
                : modelApis?.[resolvedKey];
        if (!access) {
            return null;
        }

        const loadUnits =
            typeof access.loadUnits === "function"
                ? access.loadUnits.bind(access)
                : null;
        const loadAll =
            typeof access.loadAll === "function"
                ? access.loadAll.bind(access)
                : null;
        const applyChanges =
            typeof access.applyChanges === "function"
                ? access.applyChanges.bind(access)
                : null;
        if (!loadUnits && !loadAll) {
            return null;
        }
        return {
            access,
            modelKey: resolvedKey,
            loadUnits,
            loadAll,
            applyChanges,
        };
    }
    async collectProjectDocuments(projectsApi) {
        const documents = [];
        let modules = [];
        try {
            const fetchedModules = await projectsApi.getModules();
            if (Array.isArray(fetchedModules)) {
                modules = fetchedModules;
            }
        } catch (error) {
            if (
                typeof console !== "undefined" &&
                typeof console.warn === "function"
            ) {
                console.warn(
                    "[collectProjectDocuments] Failed to read modules:",
                    error
                );
            }
            return documents;
        }

        const stack = [];
        for (const module of modules) {
            if (!module || typeof module.$ID !== "string") {
                continue;
            }
            stack.push({
                containerId: module.$ID,
                moduleName: typeof module.name === "string" ? module.name : "",
                folderPath: [],
            });
        }
        while (stack.length) {
            const context = stack.pop();
            if (!context || typeof context.containerId !== "string") {
                continue;
            }
            try {
                const documentInfos = await projectsApi.getDocumentsInfo(
                    context.containerId
                );
                if (Array.isArray(documentInfos)) {
                    for (const info of documentInfos) {
                        if (!info || typeof info.$ID !== "string") {
                            continue;
                        }
                        documents.push({
                            info,
                            moduleName: context.moduleName,
                            folderPath: context.folderPath,
                        });
                    }
                }
            } catch (docError) {
                if (
                    typeof console !== "undefined" &&
                    typeof console.warn === "function"
                ) {
                    console.warn(
                        `[collectProjectDocuments] Failed to read documents for container ${context.containerId}:`,
                        docError
                    );
                }
            }
            if (typeof projectsApi.getFolders !== "function") {
                continue;
            }
            try {
                const folders = await projectsApi.getFolders(
                    context.containerId
                );
                if (!Array.isArray(folders)) {
                    continue;
                }
                for (const folder of folders) {
                    if (!folder || typeof folder.$ID !== "string") {
                        continue;
                    }

                    const folderName =
                        typeof folder.name === "string" && folder.name
                            ? folder.name
                            : "";
                    stack.push({
                        containerId: folder.$ID,
                        moduleName: context.moduleName,
                        folderPath: folderName
                            ? [...context.folderPath, folderName]
                            : [...context.folderPath],
                    });
                }
            } catch (folderError) {
                if (
                    typeof console !== "undefined" &&
                    typeof console.warn === "function"
                ) {
                    console.warn(
                        `[collectProjectDocuments] Failed to read folders for container ${context.containerId}:`,
                        folderError
                    );
                }
            }
        }
        return documents;
    }
    async searchDocumentsAcrossProject(searchTermLower, projectsApi) {
        const documents = await this.collectProjectDocuments(projectsApi);
        if (!documents.length) {
            return [];
        }

        const results = [];
        const chunkSize = 20;
        const batches = new Map();
        for (const entry of documents) {
            const info = entry?.info;
            const unitId = info?.$ID;
            const unitType = info?.$Type;
            if (!unitId || !unitType) {
                continue;
            }

            const descriptor = resolveDocumentDescriptor(unitType) ?? {
                componentKey: "projects",
                modelKey: "projects",
                label: formatActionKindLabel(unitType),
                typePrefixes: [unitType],
            };

            const batchKey = `${descriptor.modelKey || "projects"}::${
                descriptor.componentKey || descriptor.modelKey || "doc"
            }::${unitType}`;
            if (!batches.has(batchKey)) {
                batches.set(batchKey, {
                    descriptor,
                    unitType,
                    ids: [],
                    infoById: new Map(),
                });
            }

            const batch = batches.get(batchKey);
            batch.ids.push(unitId);
            batch.infoById.set(unitId, {
                ...info,
                moduleName:
                    info?.moduleName ??
                    entry.moduleName ??
                    info?.moduleName ??
                    "",
            });
        }
        for (const batch of batches.values()) {
            if (!batch.ids.length) {
                continue;
            }

            const loader = this.resolveModelAccess(batch.descriptor.modelKey);
            if (!loader) {
                continue;
            }

            const idChunks = chunkArray(batch.ids, chunkSize);
            for (const chunkIds of idChunks) {
                if (!chunkIds.length) {
                    continue;
                }

                let units = [];
                try {
                    if (loader.loadUnits) {
                        units = await loader.loadUnits(
                            batch.unitType,
                            chunkIds
                        );
                    } else if (loader.loadAll) {
                        const chunkIdSet = new Set(chunkIds);
                        units = await loader.loadAll(
                            (info) => chunkIdSet.has(info.$ID),
                            chunkIds.length
                        );
                    }
                } catch (loadError) {
                    if (
                        typeof console !== "undefined" &&
                        typeof console.warn === "function"
                    ) {
                        console.warn(
                            `[searchDocumentsAcrossProject] Failed to load units for ${batch.descriptor.label}:`,
                            loadError
                        );
                    }
                    continue;
                }
                if (!Array.isArray(units) || !units.length) {
                    continue;
                }

                const idToInfo = new Map(
                    chunkIds.map((id) => [id, batch.infoById.get(id)])
                );
                for (const unit of units) {
                    if (!unit || typeof unit !== "object") {
                        continue;
                    }

                    const unitId =
                        (typeof unit.$ID === "string" && unit.$ID) ||
                        (unit?.$ID &&
                            typeof unit.$ID === "string" &&
                            unit.$ID) ||
                        "";
                    const info =
                        idToInfo.get(unitId) || batch.infoById.get(unitId);
                    const matches = collectMatchesFromUnit({
                        unit,
                        searchTermLower,
                        unitInfo: info,
                        componentLabel: batch.descriptor.label,
                        modelKey: batch.descriptor.modelKey,
                    });
                    if (!matches.length) {
                        continue;
                    }

                    const resolvedUnitId =
                        unitId ||
                        (info && typeof info.$ID === "string" ? info.$ID : "");
                    if (!resolvedUnitId) {
                        continue;
                    }

                    const moduleName =
                        info?.moduleName ??
                        (typeof unit.moduleName === "string"
                            ? unit.moduleName
                            : "");
                    const documentName =
                        info?.name ??
                        (typeof unit.name === "string"
                            ? unit.name
                            : "(unnamed)");
                    const displayName = moduleName
                        ? `${moduleName} / ${documentName}`
                        : documentName;
                    const qualifiedName =
                        moduleName && documentName
                            ? `${moduleName}.${documentName}`
                            : documentName;
                    const unitTypeName =
                        info?.$Type ?? unit.$Type ?? batch.descriptor.label;
                    const documentType = formatActionKindLabel(unitTypeName);
                    const enrichedMatches = matches.map((match) => ({
                        ...match,
                        componentKey: batch.descriptor.componentKey,
                        modelKey: match?.modelKey || batch.descriptor.modelKey,
                    }));
                    results.push({
                        documentId: resolvedUnitId,
                        documentName,
                        displayName,
                        moduleName,
                        qualifiedName,
                        documentType,
                        unitType: unitTypeName,
                        componentKey: batch.descriptor.componentKey,
                        modelKey: batch.descriptor.modelKey,
                        componentLabel: batch.descriptor.label,
                        matches: enrichedMatches,
                    });
                }
            }
        }
        return results;
    }
    async searchDocumentsViaComponents(searchTermLower) {
        const results = [];
        const chunkSize = 25;
        const modelApis = this.studioPro.app.model ?? {};
        for (const component of MODEL_COMPONENTS) {
            const access = modelApis?.[component.modelKey];
            if (!access || typeof access.getUnitsInfo !== "function") {
                continue;
            }

            let unitInfos = [];
            try {
                const fetched = await access.getUnitsInfo();
                if (Array.isArray(fetched)) {
                    unitInfos = fetched;
                }
            } catch (error) {
                if (
                    typeof console !== "undefined" &&
                    typeof console.warn === "function"
                ) {
                    console.warn(
                        `[searchDocumentsViaComponents] Failed to read units for ${component.componentKey}:`,
                        error
                    );
                }
                continue;
            }
            if (!unitInfos.length) {
                continue;
            }
            for (let index = 0; index < unitInfos.length; index += chunkSize) {
                const chunk = unitInfos.slice(index, index + chunkSize);
                const chunkIdSet = new Set(chunk.map((info) => info.$ID));
                const idToInfo = new Map(chunk.map((info) => [info.$ID, info]));
                let units = [];
                try {
                    if (typeof access.loadAll === "function") {
                        units = await access.loadAll(
                            (info) => chunkIdSet.has(info.$ID),
                            chunk.length
                        );
                    } else if (
                        typeof access.loadUnits === "function" &&
                        chunk.length
                    ) {
                        units = await access.loadUnits(
                            chunk[0].$Type,
                            chunk.map((info) => info.$ID)
                        );
                    }
                } catch (loadError) {
                    if (
                        typeof console !== "undefined" &&
                        typeof console.warn === "function"
                    ) {
                        console.warn(
                            `[searchDocumentsViaComponents] Failed to load units for ${component.componentKey}:`,
                            loadError
                        );
                    }
                    continue;
                }
                if (!Array.isArray(units) || !units.length) {
                    continue;
                }
                for (const unit of units) {
                    if (!unit || typeof unit !== "object") {
                        continue;
                    }

                    const unitId =
                        (typeof unit.$ID === "string" && unit.$ID) ||
                        (unit?.$ID &&
                            typeof unit.$ID === "string" &&
                            unit.$ID) ||
                        "";
                    const info = idToInfo.get(unitId) || idToInfo.get(unit.$ID);
                    const matches = collectMatchesFromUnit({
                        unit,
                        searchTermLower,
                        unitInfo: info,
                        componentLabel: component.label,
                        modelKey: component.modelKey,
                    });
                    if (!Array.isArray(matches) || !matches.length) {
                        continue;
                    }

                    const resolvedUnitId =
                        unitId ||
                        (info && typeof info.$ID === "string" ? info.$ID : "");
                    if (!resolvedUnitId) {
                        continue;
                    }

                    const moduleName =
                        info?.moduleName ??
                        (typeof unit.moduleName === "string"
                            ? unit.moduleName
                            : "");
                    const documentName =
                        info?.name ??
                        (typeof unit.name === "string"
                            ? unit.name
                            : "(unnamed)");
                    const displayName = moduleName
                        ? `${moduleName} / ${documentName}`
                        : documentName;
                    const qualifiedName =
                        moduleName && documentName
                            ? `${moduleName}.${documentName}`
                            : documentName;
                    const unitTypeName =
                        info?.$Type ?? unit.$Type ?? component.label;
                    const documentType = formatActionKindLabel(unitTypeName);
                    const enrichedMatches = matches.map((match) => ({
                        ...match,
                        componentKey: component.componentKey,
                        modelKey: match?.modelKey || component.modelKey,
                    }));
                    results.push({
                        documentId: resolvedUnitId,
                        documentName,
                        displayName,
                        moduleName,
                        qualifiedName,
                        documentType,
                        unitType: unitTypeName,
                        componentKey: component.componentKey,
                        modelKey: component.modelKey,
                        componentLabel: component.label,
                        matches: enrichedMatches,
                    });
                }
            }
        }
        return results;
    }
    async openDocument(result) {
        if (!this.studioPro) {
            throw new Error("Studio Pro API is not available yet.");
        }

        const documentId =
            typeof result === "string"
                ? result
                : result && typeof result === "object"
                ? result.documentId || result.$ID || ""
                : "";
        if (!documentId) {
            throw new Error(
                "Document identifier is required to open the editor."
            );
        }

        const editorsApi = this.studioPro.ui?.editors;
        if (!editorsApi || typeof editorsApi.editDocument !== "function") {
            throw new Error("Editor API is not available.");
        }
        await editorsApi.editDocument(documentId);
    }
    async performReplace(results, searchTerm, replaceTerm) {
        if (!this.studioPro) {
            throw new Error("Studio Pro API is not available yet.");
        }

        const trimmedSearch = (searchTerm ?? "").trim();
        if (!trimmedSearch) {
            throw new Error("Search term is required to perform replace.");
        }

        const replacementValue = String(replaceTerm ?? "");
        const replacementPattern = new RegExp(
            escapeRegExp(trimmedSearch),
            "gi"
        );
        const payload = Array.isArray(results)
            ? results
            : results
            ? [results]
            : [];
        const operationsByComponent = new Map();
        for (const result of payload) {
            if (!result) {
                continue;
            }

            const unitId = result.documentId;
            const componentKey =
                result.componentKey ||
                (Array.isArray(result.matches) &&
                    result.matches[0]?.componentKey) ||
                (Array.isArray(result.matchedVariables) &&
                    result.matchedVariables[0]?.componentKey) ||
                "";
            const modelKey =
                result.modelKey ||
                (Array.isArray(result.matches) &&
                    result.matches[0]?.modelKey) ||
                (Array.isArray(result.matchedVariables) &&
                    result.matchedVariables[0]?.modelKey) ||
                componentKey;
            if (!unitId || !componentKey || !modelKey) {
                continue;
            }

            const modelAccess = this.resolveModelAccess(modelKey);
            if (
                !modelAccess ||
                typeof modelAccess.applyChanges !== "function"
            ) {
                continue;
            }

            const matchesArray = Array.isArray(result.matches)
                ? result.matches
                : Array.isArray(result.matchedVariables)
                ? result.matchedVariables
                : [];
            if (!matchesArray.length) {
                continue;
            }
            for (const match of matchesArray) {
                const targetId =
                    match?.targetId ||
                    match?.elementId ||
                    match?.actionElementId ||
                    match?.actionId;
                const propertyName = match?.propertyName || "name";
                const currentValue =
                    typeof match?.value === "string"
                        ? match.value
                        : typeof match?.variableName === "string"
                        ? match.variableName
                        : "";
                if (!targetId || !propertyName) {
                    continue;
                }
                replacementPattern.lastIndex = 0;
                const newValue = currentValue.replace(
                    replacementPattern,
                    () => replacementValue
                );
                if (newValue === currentValue) {
                    continue;
                }

                const operationsKey = `${modelKey}::${componentKey}`;
                if (!operationsByComponent.has(operationsKey)) {
                    operationsByComponent.set(operationsKey, {
                        modelAccess,
                        componentLabel: result.componentLabel || componentKey,
                        componentKey,
                        modelKey,
                        units: new Map(),
                    });
                }

                const componentBucket =
                    operationsByComponent.get(operationsKey);
                if (!componentBucket.units.has(unitId)) {
                    componentBucket.units.set(unitId, {
                        operations: [],
                        replacements: [],
                        unitId,
                        unitLabel:
                            result.displayName || result.documentName || unitId,
                    });
                }

                const unitBucket = componentBucket.units.get(unitId);
                unitBucket.operations.push({
                    type: "setProperty",
                    unitId,
                    targetId,
                    propertyName,
                    value: newValue,
                });
                unitBucket.replacements.push({
                    actionId: targetId,
                    targetId,
                    propertyName,
                    kind: match?.kind ?? "",
                    kindLabel: match?.kindLabel ?? "",
                    oldName: currentValue,
                    newName: newValue,
                    componentKey,
                    modelKey,
                    unitId,
                });
            }
        }
        if (!operationsByComponent.size) {
            return {
                success: false,
                replacements: [],
                message: "No matches required changes.",
            };
        }

        const allReplacements = [];
        for (const bucket of operationsByComponent.values()) {
            for (const unitBucket of bucket.units.values()) {
                if (!unitBucket.operations.length) {
                    continue;
                }
                try {
                    await bucket.modelAccess.applyChanges(
                        unitBucket.operations
                    );
                } catch (error) {
                    const labelParts = [
                        bucket.componentLabel || "document",
                        unitBucket.unitLabel &&
                        unitBucket.unitLabel !== bucket.componentLabel
                            ? unitBucket.unitLabel
                            : "",
                    ].filter(Boolean);
                    const label = labelParts.join(" - ") || "document";
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : String(error ?? "Unknown error");
                    throw new Error(
                        `Failed to apply changes for ${label}: ${errorMessage}`
                    );
                }
                allReplacements.push(...unitBucket.replacements);
            }
        }
        if (!allReplacements.length) {
            return {
                success: false,
                replacements: [],
                message: "No matches required changes.",
            };
        }
        return {
            success: true,
            replacements: allReplacements,
            message: `Updated ${allReplacements.length} item${
                allReplacements.length === 1 ? "" : "s"
            }.`,
        };
    }
}

export const component = new TabComponent();
