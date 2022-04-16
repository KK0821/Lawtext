import React from "react";

// eslint-disable-next-line no-irregular-whitespace
export const HTMLMarginSpan: React.FC<React.HTMLAttributes<HTMLSpanElement>> = props => <span {...props}>　</span>;

export type WrapperComponentProps = {
    htmlComponentID: string;
    childProps: HTMLComponentProps;
    ChildComponent: React.ComponentType<HTMLComponentProps>;
};
export interface HTMLOptions {
    WrapComponent?: React.FC<WrapperComponentProps>;
    renderControlEL?: boolean;
    options?: object;
}

export interface HTMLComponentProps {
    htmlOptions: HTMLOptions;
}

export function wrapHTMLComponent<P, TComponentID extends string>(htmlComponentID: TComponentID, Component: React.ComponentType<P & HTMLComponentProps>) {
    const ret = ((props: P & HTMLComponentProps) => {
        const { htmlOptions } = props;
        if (htmlOptions.WrapComponent) {
            return (
                <htmlOptions.WrapComponent
                    htmlComponentID={htmlComponentID}
                    childProps={props}
                    ChildComponent={Component as React.ComponentType<HTMLComponentProps>}
                />
            );
        } else {
            return <Component {...props} />;
        }
    }) as React.FC<P & HTMLComponentProps> & {componentID: TComponentID};
    ret.componentID = htmlComponentID;
    return ret;
}
