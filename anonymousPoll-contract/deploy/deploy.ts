import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedAnonymousPoll = await deploy("AnonymousPoll", {
    from: deployer,
    log: true,
    args: []
  });

  console.log(`AnonymousPoll contract: `, deployedAnonymousPoll.address);

};
export default func;
func.id = "deployAnonymousPoll";
func.tags = ["AnonymousPoll"];
