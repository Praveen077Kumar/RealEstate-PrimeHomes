import { useSelector, useDispatch } from "react-redux";
import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { app } from "../firebase";
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  userDeleteStart,
  userDeleteSuccess,
  userDeleteFailure,
  userSignOutStart,
  userSignOutSuccess,
  userSignOutFailure
} from "../redux/user/userSlice";

const Profile = () => {
  const fileRef = useRef(null);
  const [file, setFile] = useState(undefined);
  const [filepercent, setFilepercent] = useState(0);
  const { loading, error } = useSelector((state) => state.user);
  const { currentUser } = useSelector((state) => state.user);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showListingError, setListingError] = useState(false);
  const [formData, setFormData] = useState({});
  const [userListings, setUserListings] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file]);

  const handleFileUpload = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilepercent(Math.round(progress));
      },
      (error) => {
        setFileUploadError(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFormData({ ...formData, avatar: downloadURL });
        });
      }
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  
  const handleSubmitUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res = await fetch(`api/user/update/${currentUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        return;
      }
      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  };

  const handleDeleteUser = async () => {
    try {
      dispatch(userDeleteStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(userDeleteFailure(data.message));
        return;
      }
      dispatch(userDeleteSuccess(data.message));
    } catch (error) {
      dispatch(userDeleteFailure(error.message));
    }
  };

  const handlerSignedOut = async () => {
    try {
      dispatch(userSignOutStart());
      const res = await fetch("/api/auth/signout");
      const data = await res.json();
      if (data.success === false) {
        dispatch(userSignOutFailure(data.message));
        return;
      }
      dispatch(userSignOutSuccess(data));
    } catch (error) {
      dispatch(userSignOutFailure(error.message));
    }
  };

  const handleShowListing = async () => {
    try {
      setListingError(false);
      const res = await fetch(`/api/user/listings/${currentUser._id}`);
      const data = await res.json();

      if (data.success === false) {
        setListingError(true);
        return;
      }
      setUserListings(data);
      setListingError(false);
    } catch (error) {
      setListingError(true);
    }
  };

  const handleDeleteListing = async(listingId)=>{
    try {
        const res = await fetch(`/api/listings/delete/${listingId}`,{
          method: 'DELETE',
        })
        const data = await res.json();
        if(data.success === false){
          console.log(data.message);
          return;
        }
        setUserListings((prev)=> prev.filter((listing)=>listing._id !== listingId));

    } catch (error) {
      console.log(error.message);
    }
  }
  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">Profile</h1>
      <form
        onSubmit={handleSubmitUpdateProfile}
        className="flex flex-col gap-4"
      >
        <input
          type="file"
          ref={fileRef}
          hidden
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <img
          onClick={() => fileRef.current.click()}
          src={formData.avatar || currentUser.avatar}
          alt="profile-pic"
          className="rounded-full h-24 w-24 object-cover cursor-pointer self-center mt-2"
        />
        <p className="text-sm self-center">
          {fileUploadError ? (
            <span className="text-red-700">
              Error Image Upload (image must be less than 2 mb )
            </span>
          ) : filepercent > 0 && filepercent < 100 ? (
            <span className="text-slate-800">{`Uploading ${filepercent}%`}</span>
          ) : filepercent === 100 ? (
            <span className="text-green-700">Image Successfully uploaded!</span>
          ) : (
            ""
          )}
        </p>
        <input
          type="text"
          placeholder="username"
          className="border p-3  rounded-lg"
          id="username"
          defaultValue={currentUser.username}
          onChange={handleChange}
        />
        <input
          type="email"
          placeholder="email"
          className="border p-3  rounded-lg"
          id="email"
          defaultValue={currentUser.email}
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="password"
          className="border p-3  rounded-lg"
          id="password"
          onChange={handleChange}
        />
        <button
          disabled={loading}
          className="border p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-90 disabled:opacity-80 "
        >
          {loading ? "Loading..." : "Update"}
        </button>
        <Link
          to={"/create-listing"}
          className="border p-3 bg-green-600 text-white text-center uppercase hover:opacity-90"
        >
          Create Listing
        </Link>
      </form>
      <div className="flex justify-between m-5">
        <span
          onClick={handleDeleteUser}
          className="text-red-700 cursor-pointer"
        >
          Delete account
        </span>
        <span
          onClick={handlerSignedOut}
          className="text-red-700 cursor-pointer"
        >
          Sign-out
        </span>
      </div>
      <p className="text-green-700 mt-5">
        {updateSuccess ? "User is Updated Successfullly! " : ""}
      </p>
      <button
        onClick={handleShowListing}
        className="text-green-600 w-full hover:underline"
      >
        Show Listings
      </button>
      <p className="text-red-700 mt-5">
        {showListingError ? "Error showing Listing" : ""}
      </p>

      {userListings &&
        userListings.length > 0 &&
        <div className=" flex flex-col gap-4">
          <h1 className="text-center mt-7 text-2xl font-semibold">Your Listings</h1>
          {userListings.map((listing) => (
          <div
            key={listing._id}
            className="border rounded-lg p-3 flex justify-between items-center gap-4"
          >
            <Link to={`/listings/${listing._id}`}>
              <img
                className="h-16 w-16 object-contain"
                src={listing.imageUrls[0]}
                alt="listing image"
              />
            </Link>
            <Link className="text-slate-700 font-semibold flex-1 hover:underline truncate" to={`/listings/${listing._id}`}>
              <p>{listing.name}</p>
            </Link>

            <div className="flex flex-col items-center">
              <button onClick={()=>handleDeleteListing(listing._id)} className="text-red-600 uppercase">Delete</button>
              <button className="text-green-600 uppercase ">Edit</button>
            </div>
          </div>
        ))}
        </div>}
        
    </div>
  );
};

export default Profile;
