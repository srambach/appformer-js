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
import {useEffect, useState} from "react";
import {match} from "react-router";
import {upper} from "./Util";
import {PatternFlyPopup} from "./PatternFlyPopup";
import {ActionGroup, Button, Form, FormGroup, TextInput} from "@patternfly/react-core";
import {Link} from "react-router-dom";
import {routes} from "./Routes";
import {getProjects, postProject} from "./service/Service";
import {Pf4Label} from "./Pf4Label";

interface Project {
  name: string;
  url: string;
}

export function Projects(props: { match: match<{ space: string }> }) {
  const [popup, setPopup] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectUrl, setNewProjectUrl] = useState("");
  const [projects, setProjects] = useState([] as Project[]);

  const updateProjects = () => {
    getProjects(props.match.params.space)
      .then(res => res.json())
      .then(json => setProjects(json));
  };

  const addProject = async (e: any) => {
    e.preventDefault();
    const createProject = await postProject(props.match.params.space, { name: newProjectName, url: newProjectUrl });
    if (createProject.status === 201) {
      updateProjects();
      setPopup(false);
    } else {
      console.info("Error creating project.");
    }
  };

  const openNewProjectPopup = (e: any) => {
    e.preventDefault();
    setPopup(true);
    setNewProjectName("");
    setNewProjectUrl("");
  };

  useEffect(() => {
    updateProjects();
    return () => {/**/};
  }, []);

  return (
    <>
      {popup && (
        <PatternFlyPopup title={"New Project"} onClose={() => setPopup(false)}>
          <Form>
            <FormGroup fieldId={"name"}>
              <Pf4Label required={true} text={"Name"} />
              <TextInput
                aria-label={"name"}
                placeholder={"Name"}
                onInput={(e: any) => setNewProjectName(e.target.value)}
                value={newProjectName}
              />
              <p className="pf-c-form__helper-text" id="help-text-simple-form-name-helper" aria-live="polite">
                Only numbers, letters, and underscores.
              </p>
            </FormGroup>
            <FormGroup fieldId={"url"}>
              <Pf4Label text={"URL"} required={true} />
              <TextInput
                aria-label={"url"}
                placeholder={"URL"}
                onInput={(e: any) => setNewProjectUrl(e.target.value)}
                value={newProjectUrl}
              />
            </FormGroup>

            <ActionGroup>
              <Button onClick={addProject} variant={"primary"} type={"submit"}>
                Add
              </Button>
              <Button onClick={() => setPopup(false)} variant={"secondary"}>
                Cancel
              </Button>
            </ActionGroup>
          </Form>
        </PatternFlyPopup>
      )}
      <div>
        <h1>
          <span>{upper(props.match.params.space)} / Projects</span>
          <span> - </span>
          <span>
            <a href={"#"} onClick={openNewProjectPopup}>
              New
            </a>
          </span>
        </h1>
        {projects.map(project => (
          <div key={project.name}>
            <Link to={routes.project({ space: props.match.params.space, project: project.name })}>
              {upper(project.name)}
            </Link>
            <br />
          </div>
        ))}
      </div>
    </>
  );
}

