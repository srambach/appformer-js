/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";
import { useEffect, useState } from "react";
import { match } from "react-router";
import { router, services } from "appformer-js-microeditor-router";
import { Breadcrumb, BreadcrumbItem, Button, PageSection, PageSectionVariants } from "@patternfly/react-core";
import { Link } from "react-router-dom";
import { routes } from "./Routes";
import { EnvelopeBusOuterMessageHandler } from "appformer-js-microeditor-envelope-protocol";
import { getFileContentService, setFileContentService } from "./service/Service";

export function Editor(props: { match: match<{ space: string; project: string; filePath: string }> }) {
  const decodedFilePath = decodeURIComponent(props.match.params.filePath.replace(/\+/g, "%20"));
  const fileExtension = decodedFilePath.split(".").pop()!;
  const languageData = router.get(fileExtension);
  if (!languageData) {
    //FIXME: Fallback to default text editor like Ace.js.
    return <div>{"Oops, no enhanced editor was found for extension " + fileExtension}</div>;
  }

  let iframe: HTMLIFrameElement;
  let envelopeBusOuterMessageHandler: EnvelopeBusOuterMessageHandler;
  const iframeDomain = services.microeditor_envelope;
  const iframeSrc = services.microeditor_envelope;

  useEffect(() => {
    envelopeBusOuterMessageHandler = new EnvelopeBusOuterMessageHandler(
      {
        postMessage: msg => {
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(msg, iframeDomain);
          }
        }
      },
      self => ({
        pollInit: () => {
          self.request_initResponse(window.location.origin);
        },
        receive_languageRequest: () => {
          self.respond_languageRequest(router.get(fileExtension));
        },
        receive_contentResponse: (content: string) => {
          setFileContentService(props.match.params.space, props.match.params.project, decodedFilePath, content).then(
            v => setEphemeralStatus("Saved.")
          );
        },
        receive_contentRequest: () => {
          getFileContentService(props.match.params.space, props.match.params.project, decodedFilePath)
            .then(res => res.text())
            .then(content => self.respond_contentRequest(content.trim()));
        }
      })
    );

    envelopeBusOuterMessageHandler.startInitPolling();

    const handle = (msg: any) => {
      return envelopeBusOuterMessageHandler.receive(msg.data);
    };

    window.addEventListener("message", handle, false);
    return () => {
      window.removeEventListener("message", handle, false);
    };
  }, []);

  const [statusMessage, setStatusMessage] = useState("");
  const [statusBarOpen, setStatusBarOpen] = useState(false);

  const setEphemeralStatus = (message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), 2000);
  };

  const save = () => {
    envelopeBusOuterMessageHandler.request_contentResponse();
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to={routes.spaces()}>Spaces</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to={routes.space({ space: props.match.params.space })}>{props.match.params.space}</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to={routes.project({ space: props.match.params.space, project: props.match.params.project })}>
              {props.match.params.project}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive={true}>
            <Link
              to={routes.file({
                space: props.match.params.space,
                project: props.match.params.project,
                filePath: props.match.params.filePath
              })}
            >
              {decodedFilePath}
            </Link>
          </BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      {/*FIXME: Stop using this padding: 0 */}
      <PageSection style={{ padding: "0" }}>
        <iframe
          style={{ borderTop: "1px solid lightgray", width: "100%", height: "100%" }}
          ref={i => (iframe = iframe ? iframe : i!)}
          src={iframeSrc}
        />
        {statusBarOpen && (
          <div
            onClick={() => setStatusBarOpen(false)}
            style={{
              color: "white",
              padding: "10px",
              backgroundColor: "#363636",
              width: "100vw",
              zIndex: 999,
              bottom: 0,
              left: 0,
              position: "fixed",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>{statusMessage}</div>
            <Button
              variant={"primary"}
              type={"button"}
              onClick={(e: any) => {
                e.stopPropagation();
                save();
              }}
            >
              Save
            </Button>
          </div>
        )}
        {!statusBarOpen && (
          <div
            onClick={() => {
              setStatusBarOpen(true);
              setEphemeralStatus("Click the status bar do hide it.");
            }}
            style={{
              color: "white",
              backgroundColor: "#363636",
              width: "100px",
              borderRadius: "5px 5px 0 0 ",
              zIndex: 999,
              bottom: "0",
              paddingTop: "4px",
              left: "50%",
              marginLeft: "-50px",
              textAlign: "center",
              position: "fixed"
            }}
          >
            ^
          </div>
        )}
      </PageSection>
    </>
  );
}
